import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment } from './payment.entity';
import { PaymentStatus, NotificationType, InvoiceType, InvoiceStatus, BillboardStatus } from '../../common/enums';
import { DebtCalculationService } from './debt-calculation.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InvoicesService } from '../invoices/invoices.service';
import { BillboardsService } from '../billboards/billboards.service';
import { User } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly debtCalculationService: DebtCalculationService,
    private readonly notificationsService: NotificationsService,
    private readonly invoicesService: InvoicesService,
    private readonly billboardsService: BillboardsService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(filters?: { clientId?: string; status?: PaymentStatus }): Promise<Payment[]> {
    const query = this.paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.client', 'client')
      .leftJoinAndSelect('payment.billboard', 'billboard');

    if (filters?.clientId) {
      query.andWhere('payment.clientId = :clientId', { clientId: filters.clientId });
    }
    if (filters?.status) {
      query.andWhere('payment.status = :status', { status: filters.status });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { id },
      relations: ['client', 'billboard', 'invoices'],
    });
  }

  async create(data: any, userId?: string): Promise<Payment> {
    const payment = this.paymentRepository.create({
      ...data,
      method: data.paymentMethod || data.method,
      referenceNumber: data.referenceNumber || this.generateReferenceNumber(),
      status: PaymentStatus.PENDING,
    });
    const savedPayment = await this.paymentRepository.save(payment) as unknown as Payment;
    
    // Link invoice to payment if invoiceId provided
    if (data.invoiceId) {
      await this.invoicesService.update(data.invoiceId, { paymentId: savedPayment.id });
    }
    
    // Audit log
    if (userId) {
      await this.auditService.log(
        userId,
        'CREATE_PAYMENT',
        'Payment',
        savedPayment.id,
        null,
        {
          referenceNumber: savedPayment.referenceNumber,
          amount: savedPayment.amount,
          status: savedPayment.status,
          clientId: data.clientId || data.client?.id,
          invoiceId: data.invoiceId,
        },
      );
    }
    
    // Enviar notificação para admins/finance sobre novo pagamento
    await this.notifyAdminsNewPayment(savedPayment);
    
    return savedPayment;
  }

  async createWithProof(data: any, file?: Express.Multer.File, userId?: string): Promise<Payment> {
    const paymentData = { 
      ...data,
      method: data.paymentMethod || data.method,
      referenceNumber: data.referenceNumber || this.generateReferenceNumber(),
      status: PaymentStatus.PENDING,
    };
    
    // If file uploaded, save the filename
    if (file) {
      paymentData.proofDocument = this.getFileUrl(file.filename);
    }

    // Se invoiceId foi fornecido, buscar o billboardId da invoice
    if (data.invoiceId) {
      const invoice = await this.invoicesService.findOne(data.invoiceId);
      if (invoice && invoice.billboardId) {
        paymentData.billboardId = invoice.billboardId;
        this.logger.log(`Payment linked to billboard ${invoice.billboardId} via invoice ${data.invoiceId}`);
      }
    }

    const payment = this.paymentRepository.create(paymentData);
    const savedPayment = await this.paymentRepository.save(payment) as unknown as Payment;
    
    // Link invoice to payment if invoiceId provided
    if (data.invoiceId) {
      await this.invoicesService.update(data.invoiceId, { paymentId: savedPayment.id });
    }
    
    // Audit log
    if (userId) {
      await this.auditService.log(
        userId,
        'SUBMIT_PAYMENT_PROOF',
        'Payment',
        savedPayment.id,
        null,
        {
          referenceNumber: savedPayment.referenceNumber,
          amount: savedPayment.amount,
          hasProof: !!file,
          proofDocument: savedPayment.proofDocument,
          clientId: data.clientId || data.client?.id,
          invoiceId: data.invoiceId,
          billboardId: savedPayment.billboardId,
        },
      );
    }
    
    // Enviar notificação para admins/finance sobre novo pagamento com comprovativo
    await this.notifyAdminsNewPayment(savedPayment);
    
    return savedPayment;
  }

  async attachProof(id: string, file: Express.Multer.File): Promise<Payment> {
    const payment = await this.findOne(id);
    
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    const proofUrl = this.getFileUrl(file.filename);
    await this.paymentRepository.update(id, { proofDocument: proofUrl });
    
    return this.findOne(id);
  }

  private getFileUrl(filename: string): string {
    const apiPrefix = this.configService.get('API_PREFIX', 'api');
    const port = this.configService.get('PORT', 3001);
    const host = this.configService.get('HOST', 'localhost');
    
    return `http://${host}:${port}/${apiPrefix}/v1/uploads/${filename}`;
  }

  async update(id: string, data: any): Promise<Payment | null> {
    await this.paymentRepository.update(id, data);
    return this.findOne(id);
  }

  async validatePayment(id: string, validatedBy: string): Promise<Payment | null> {
    const payment = await this.findOne(id);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    const oldStatus = payment.status;

    await this.paymentRepository.update(id, {
      status: PaymentStatus.VALIDATED,
      validatedBy,
      validatedAt: new Date(),
    });
    
    const updatedPayment = await this.findOne(id);
    
    // Atualizar fatura para PAID se invoiceId presente
    if (payment.invoices && payment.invoices.length > 0) {
      for (const invoice of payment.invoices) {
        await this.invoicesService.update(invoice.id, { status: InvoiceStatus.PAID });
        this.logger.log(`Invoice ${invoice.id} marcada como PAID`);
      }
    }
    
    // Atualizar billboard para ACTIVE se billboardId presente
    if (payment.billboardId) {
      await this.billboardsService.update(payment.billboardId, { status: BillboardStatus.ACTIVE });
      this.logger.log(`Billboard ${payment.billboardId} marcado como ACTIVE`);
    }
    
    // Audit log
    await this.auditService.log(
      validatedBy,
      'VALIDATE_PAYMENT',
      'Payment',
      id,
      { status: oldStatus },
      { 
        status: PaymentStatus.VALIDATED,
        amount: payment.amount,
        referenceNumber: payment.referenceNumber,
        clientId: payment.client?.id,
      },
    );
    
    // Geração de recibo agora é manual pelo admin
    // O admin deve fazer upload do recibo usando o endpoint /api/v1/invoices
    this.logger.log(`Pagamento ${id} validado. Recibo deve ser gerado manualmente pelo admin.`);
    
    // Notificar cliente
    if (updatedPayment && updatedPayment.client) {
      await this.notifyClientPaymentValidated(updatedPayment);
    }
    
    return updatedPayment;
  }

  async rejectPayment(id: string, reason: string, validatedBy: string): Promise<Payment | null> {
    const payment = await this.findOne(id);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    const oldStatus = payment.status;

    await this.paymentRepository.update(id, {
      status: PaymentStatus.REJECTED,
      rejectionReason: reason,
      validatedBy,
      validatedAt: new Date(),
    });
    
    const updatedPayment = await this.findOne(id);
    
    // Atualizar fatura para OVERDUE se invoiceId presente
    if (payment.invoices && payment.invoices.length > 0) {
      for (const invoice of payment.invoices) {
        await this.invoicesService.update(invoice.id, { status: InvoiceStatus.OVERDUE });
        this.logger.log(`Invoice ${invoice.id} marcada como OVERDUE`);
      }
    }
    
    // Atualizar billboard para IN_DEBT se billboardId presente
    if (payment.billboardId) {
      await this.billboardsService.update(payment.billboardId, { status: BillboardStatus.IN_DEBT });
      this.logger.log(`Billboard ${payment.billboardId} marcado como IN_DEBT`);
    }
    
    // Audit log
    await this.auditService.log(
      validatedBy,
      'REJECT_PAYMENT',
      'Payment',
      id,
      { status: oldStatus },
      { 
        status: PaymentStatus.REJECTED,
        rejectionReason: reason,
        amount: payment.amount,
        referenceNumber: payment.referenceNumber,
        clientId: payment.client?.id,
      },
    );
    
    // Notificar cliente sobre rejeição do pagamento
    if (updatedPayment && updatedPayment.client) {
      await this.notifyClientPaymentRejected(updatedPayment, reason);
    }
    
    return updatedPayment;
  }

  /**
   * Criar pagamento com cálculo automático de dívida
   */
  async createPaymentWithDebtCalculation(billboardId: string, clientId: string, file?: Express.Multer.File): Promise<{
    payment: Payment;
    debtInfo: any;
  }> {
    // Calcular dívida atual
    const debtInfo = await this.debtCalculationService.calculateDebt(billboardId);
    
    // Criar pagamento com valor calculado
    const paymentData = {
      client: { id: clientId },
      billboard: { id: billboardId },
      amount: debtInfo.totalWithPenaltiesAndTax,
      referenceNumber: this.generateReferenceNumber(),
      paymentDate: new Date(),
      dueDate: debtInfo.nextPaymentDue,
      notes: `Pagamento automático - Dívida: ${debtInfo.currentDebt} MT + Penalidades: ${debtInfo.penaltyAmount} MT + IVA: ${debtInfo.taxAmount} MT`,
    };

    const payment = file 
      ? await this.createWithProof(paymentData, file)
      : await this.create(paymentData);

    return { payment, debtInfo };
  }

  /**
   * Gerar número de referência único
   */
  private generateReferenceNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `PAY-${timestamp}-${random}`;
  }

  /**
   * Notificar admins sobre novo pagamento
   */
  private async notifyAdminsNewPayment(payment: Payment): Promise<void> {
    try {
      // Buscar todos os usuários ADMIN e FINANCE
      const admins = await this.userRepository.find({
        where: [
          { role: 'admin' as any },
          { role: 'finance' as any },
        ],
      });

      // Criar notificação para cada admin
      for (const admin of admins) {
        await this.notificationsService.create(
          admin.id,
          NotificationType.PAYMENT,
          'Novo Pagamento Submetido',
          `Pagamento de ${payment.amount} MT foi submetido. Referência: ${payment.referenceNumber}`,
          {
            paymentId: payment.id,
            amount: payment.amount,
            referenceNumber: payment.referenceNumber,
          },
          true, // Enviar email
        );
      }
    } catch (error) {
      console.error('Erro ao notificar admins:', error);
    }
  }

  /**
   * Notificar cliente sobre validação de pagamento
   */
  private async notifyClientPaymentValidated(payment: Payment, pdfUrl?: string): Promise<void> {
    try {
      const payment_full = await this.paymentRepository.findOne({
        where: { id: payment.id },
        relations: ['client', 'client.user'],
      });

      if (payment_full?.client?.user) {
        const message = pdfUrl
          ? `Seu pagamento de ${payment.amount} MT foi validado com sucesso! Referência: ${payment.referenceNumber}. Baixe seu recibo: ${pdfUrl}`
          : `Seu pagamento de ${payment.amount} MT foi validado com sucesso! Referência: ${payment.referenceNumber}`;

        await this.notificationsService.create(
          payment_full.client.user.id,
          NotificationType.APPROVAL,
          'Pagamento Validado',
          message,
          {
            paymentId: payment.id,
            amount: payment.amount,
            referenceNumber: payment.referenceNumber,
            status: PaymentStatus.VALIDATED,
            receiptUrl: pdfUrl,
          },
          true, // Enviar email
        );
      }
    } catch (error) {
      console.error('Erro ao notificar cliente:', error);
    }
  }

  /**
   * Notificar cliente sobre rejeição de pagamento
   */
  private async notifyClientPaymentRejected(payment: Payment, reason: string): Promise<void> {
    try {
      const payment_full = await this.paymentRepository.findOne({
        where: { id: payment.id },
        relations: ['client', 'client.user'],
      });

      if (payment_full?.client?.user) {
        await this.notificationsService.create(
          payment_full.client.user.id,
          NotificationType.REJECTION,
          'Pagamento Rejeitado',
          `Seu pagamento de ${payment.amount} MT foi rejeitado. Motivo: ${reason}`,
          {
            paymentId: payment.id,
            amount: payment.amount,
            referenceNumber: payment.referenceNumber,
            status: PaymentStatus.REJECTED,
            reason,
          },
          true, // Enviar email
        );
      }
    } catch (error) {
      console.error('Erro ao notificar cliente:', error);
    }
  }
}

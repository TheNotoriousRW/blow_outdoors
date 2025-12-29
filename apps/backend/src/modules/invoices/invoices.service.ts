import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './invoice.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../common/enums';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(): Promise<Invoice[]> {
    return this.invoiceRepository.find({ 
      relations: ['client', 'payment'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByClient(clientId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { clientId },
      relations: ['client', 'payment'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ 
      where: { id }, 
      relations: ['client', 'payment'] 
    });
    
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    
    return invoice;
  }

  async findByNumber(invoiceNumber: string): Promise<Invoice | null> {
    return this.invoiceRepository.findOne({
      where: { invoiceNumber },
      relations: ['client', 'payment'],
    });
  }

  async create(data: any): Promise<Invoice> {
    // Calcular totalAmount se não fornecido
    if (!data.totalAmount && data.amount) {
      const amount = Number(data.amount);
      const tax = Number(data.tax || 0);
      data.totalAmount = amount + tax;
    }
    
    const invoice = this.invoiceRepository.create(data);
    const result: any = await this.invoiceRepository.save(invoice);
    const invoiceId = Array.isArray(result) ? result[0].id : result.id;
    
    // Notificar cliente
    try {
      await this.notifyClient(invoiceId);
    } catch (error) {
      this.logger.error('Error notifying client', error);
    }
    
    return this.findOne(invoiceId);
  }

  async update(id: string, data: any): Promise<Invoice> {
    const invoice = await this.findOne(id);
    
    // Recalcular totalAmount se amount ou tax mudaram
    if (data.amount !== undefined || data.tax !== undefined) {
      const amount = Number(data.amount ?? invoice.amount);
      const tax = Number(data.tax ?? invoice.tax);
      data.totalAmount = amount + tax;
    }
    
    Object.assign(invoice, data);
    await this.invoiceRepository.save(invoice);
    
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id);
    await this.invoiceRepository.remove(invoice);
  }

  /**
   * Notificar cliente sobre nova fatura
   */
  private async notifyClient(invoiceId: string): Promise<void> {
    try {
      const invoice = await this.invoiceRepository.findOne({
        where: { id: invoiceId },
        relations: ['client', 'client.user', 'payment'],
      });

      if (!invoice?.client?.user) {
        this.logger.warn(`Cannot notify client - no user found for invoice ${invoiceId}`);
        return;
      }

      const user = invoice.client.user;
      const title = 'Nova Fatura Disponível';
      const message = `Fatura ${invoice.invoiceNumber} foi emitida. Valor total: ${Number(invoice.totalAmount).toFixed(2)} MT. ${invoice.dueDate ? `Vencimento: ${new Date(invoice.dueDate).toLocaleDateString('pt-BR')}` : ''}`;

      await this.notificationsService.create(
        user.id,
        NotificationType.SYSTEM,
        title,
        message,
        {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          totalAmount: invoice.totalAmount,
          fileUrl: invoice.fileUrl,
        },
        true, // Enviar email
      );

      this.logger.log(`Notificação enviada para cliente ${user.email} sobre fatura ${invoice.invoiceNumber}`);
    } catch (error) {
      this.logger.error(`Erro ao notificar cliente: ${error.message}`, error.stack);
    }
  }
}

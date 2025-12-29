import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Invoice } from './invoice.entity';
import { InvoicesService } from './invoices.service';
import { Billboard } from '../billboards/billboard.entity';
import { TariffsService } from '../tariffs/tariffs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { InvoiceType, NotificationType, BillboardStatus } from '../../common/enums';

@Injectable()
export class ProformaGeneratorService {
  private readonly logger = new Logger(ProformaGeneratorService.name);

  constructor(
    @InjectRepository(Billboard)
    private readonly billboardRepository: Repository<Billboard>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly invoicesService: InvoicesService,
    private readonly tariffsService: TariffsService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Generate proforma invoice when billboard is created
   */
  async generateProformaForNewBillboard(billboardId: string): Promise<Invoice | null> {
    try {
      const billboard = await this.billboardRepository.findOne({
        where: { id: billboardId },
        relations: ['client', 'client.user', 'tariffZone'],
      });

      if (!billboard || !billboard.client) {
        this.logger.error(`Billboard ${billboardId} not found or has no client`);
        return null;
      }

      // Calculate tariff - use billboard's stored annualFee or calculate from tariff
      const rateInfo = await this.tariffsService.calculateAnnualRate(
        billboard.tariffZone?.id,
        billboard.type,
      );

      if (!rateInfo.tariff) {
        this.logger.warn(
          `No tariff found for billboard ${billboard.code}. Type: ${billboard.type}`,
        );
        return null;
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(InvoiceType.PROFORMA);

      // Calculate due date (30 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Calculate amounts (annual rate)
      const amount = rateInfo.calculatedAnnualRate;
      const tax = amount * 0.16; // IVA 16%
      const totalAmount = amount + tax;

      // Create proforma invoice (manual - admin will upload file later)
      const invoice = this.invoiceRepository.create({
        invoiceNumber,
        type: InvoiceType.PROFORMA,
        clientId: billboard.client.id,
        amount,
        tax,
        totalAmount,
        issueDate: new Date(),
        dueDate,
        description: `Fatura Pro Forma - Painel ${billboard.code}`,
        notes: `Taxa anual: ${rateInfo.calculatedAnnualRate.toFixed(2)} MT/ano. Área: ${billboard.area}m². Tarifa: ${rateInfo.pricePerSquareMeterPerYear.toFixed(2)} MT/m²/ano`,
      });

      const savedInvoice = await this.invoiceRepository.save(invoice) as Invoice;

      // PDF geração agora é manual - admin fará upload
      this.logger.log(`Proforma invoice ${invoiceNumber} created. Admin should upload PDF manually.`);

      // Notify client
      if (billboard.client.user) {
        await this.notificationsService.create(
          billboard.client.user.id,
          NotificationType.PROFORMA_INVOICE,
          'Nova Fatura Pro Forma Disponível',
          `Fatura pro forma ${invoiceNumber} gerada para o painel ${billboard.code}. Valor: ${totalAmount.toFixed(2)} MT. Vencimento: ${dueDate.toISOString().split('T')[0]}. Admin irá fazer upload do PDF.`,
          {
            invoiceId: savedInvoice.id,
            invoiceNumber,
            billboardId: billboard.id,
            billboardCode: billboard.code,
            totalAmount,
            dueDate,
            fileUrl: savedInvoice.fileUrl,
          },
          true,
        );
      }

      // Audit log
      await this.auditService.log(
        'system',
        'GENERATE_PROFORMA',
        'Invoice',
        savedInvoice.id,
        null,
        {
          invoiceNumber,
          billboardId: billboard.id,
          billboardCode: billboard.code,
          amount: totalAmount,
        },
      );

      this.logger.log(
        `Proforma invoice ${invoiceNumber} generated for billboard ${billboard.code}`,
      );

      return savedInvoice;
    } catch (error) {
      this.logger.error(
        `Error generating proforma for billboard ${billboardId}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Generate monthly proforma invoices for all active billboards
   * Runs on the 1st day of each month at 6:00 AM
   */
  @Cron('0 6 1 * *') // Every 1st day of month at 6:00 AM
  async generateMonthlyProformas() {
    this.logger.log('Starting monthly proforma invoice generation...');

    try {
      const billboards = await this.billboardRepository.find({
        where: {
          status: BillboardStatus.ACTIVE,
          isActive: true,
        },
        relations: ['client', 'client.user', 'tariffZone'],
      });

      let successCount = 0;
      let errorCount = 0;

      for (const billboard of billboards) {
        try {
          // Check if proforma was already generated this month
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();

          const existingProforma = await this.invoiceRepository
            .createQueryBuilder('invoice')
            .where('invoice.type = :type', { type: InvoiceType.PROFORMA })
            .andWhere('invoice.clientId = :clientId', { clientId: billboard.client.id })
            .andWhere('invoice.metadata @> :metadata', {
              metadata: JSON.stringify({ billboardId: billboard.id }),
            })
            .andWhere('EXTRACT(MONTH FROM invoice.issueDate) = :month', { month: currentMonth + 1 })
            .andWhere('EXTRACT(YEAR FROM invoice.issueDate) = :year', { year: currentYear })
            .getOne();

          if (existingProforma) {
            this.logger.log(
              `Proforma already exists for billboard ${billboard.code} this month. Skipping.`,
            );
            continue;
          }

          await this.generateProformaForNewBillboard(billboard.id);
          successCount++;
        } catch (error) {
          this.logger.error(
            `Error generating proforma for billboard ${billboard.code}: ${error.message}`,
          );
          errorCount++;
        }
      }

      this.logger.log(
        `Monthly proforma generation completed. Success: ${successCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      this.logger.error(`Error in monthly proforma generation: ${error.message}`, error.stack);
    }
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(type: InvoiceType): Promise<string> {
    const prefix = type === InvoiceType.PROFORMA ? 'PRO' : 'INV';
    const year = new Date().getFullYear();

    const lastInvoice = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.invoiceNumber LIKE :pattern', { pattern: `${prefix}-${year}-%` })
      .orderBy('invoice.createdAt', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastInvoice) {
      const match = lastInvoice.invoiceNumber.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}-${year}-${nextNumber.toString().padStart(6, '0')}`;
  }
}

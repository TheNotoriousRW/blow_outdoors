import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Billboard } from '../billboards/billboard.entity';
import { Payment } from '../payments/payment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { DebtCalculationService } from '../payments/debt-calculation.service';
import { BillboardStatus, PaymentStatus, NotificationType } from '../../common/enums';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    @InjectRepository(Billboard)
    private readonly billboardRepository: Repository<Billboard>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly notificationsService: NotificationsService,
    private readonly debtCalculationService: DebtCalculationService,
  ) {}

  /**
   * Run every day at 9:00 AM to check for upcoming due dates
   * Notifies clients 7 days before due date
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkUpcomingDueDates() {
    this.logger.log('Running scheduled check for upcoming due dates...');

    try {
      // Get all active billboards
      const billboards = await this.billboardRepository.find({
        where: { 
          status: BillboardStatus.ACTIVE,
          isActive: true 
        },
        relations: ['client', 'client.user', 'payments'],
      });

      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);

      let notificationsSent = 0;

      for (const billboard of billboards) {
        if (!billboard.client?.user) continue;

        try {
          // Calculate current debt
          const debtInfo = await this.debtCalculationService.calculateDebt(billboard.id);

          // Check if has debt and next payment is within 7 days
          if (debtInfo.currentDebt > 0) {
            const nextPaymentDue = debtInfo.nextPaymentDue ? new Date(debtInfo.nextPaymentDue) : null;

            if (nextPaymentDue && nextPaymentDue <= sevenDaysFromNow && nextPaymentDue > today) {
              const daysUntilDue = Math.ceil((nextPaymentDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

              await this.notificationsService.create(
                billboard.client.user.id,
                NotificationType.DUE_DATE,
                'Pagamento Próximo ao Vencimento',
                `O painel ${billboard.code} tem um pagamento pendente de ${debtInfo.totalWithPenaltiesAndTax.toFixed(2)} MT que vence em ${daysUntilDue} dias (${nextPaymentDue.toISOString().split('T')[0]}).`,
                {
                  billboardId: billboard.id,
                  billboardCode: billboard.code,
                  amountDue: debtInfo.totalWithPenaltiesAndTax,
                  dueDate: nextPaymentDue,
                  daysUntilDue,
                },
                true, // Send email
              );

              notificationsSent++;
            }
          }
        } catch (error) {
          this.logger.error(`Error processing billboard ${billboard.id}: ${error.message}`);
        }
      }

      this.logger.log(`Upcoming due dates check completed. Sent ${notificationsSent} notifications.`);
    } catch (error) {
      this.logger.error(`Error in checkUpcomingDueDates: ${error.message}`, error.stack);
    }
  }

  /**
   * Run every day at 10:00 AM to check for overdue payments
   * Updates billboard status to IN_DEBT if payment is overdue
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async checkOverduePayments() {
    this.logger.log('Running scheduled check for overdue payments...');

    try {
      const billboards = await this.billboardRepository.find({
        where: { 
          status: BillboardStatus.ACTIVE,
          isActive: true 
        },
        relations: ['client', 'client.user', 'payments', 'tariffZone'],
      });

      const today = new Date();
      let billboardsUpdated = 0;
      let notificationsSent = 0;

      for (const billboard of billboards) {
        try {
          const debtInfo = await this.debtCalculationService.calculateDebt(billboard.id);

          // If has debt and is overdue
          if (debtInfo.currentDebt > 0 && debtInfo.yearsInDebt > 0) {
            // Update status to IN_DEBT if not already
            if (billboard.status !== BillboardStatus.IN_DEBT) {
              await this.billboardRepository.update(billboard.id, {
                status: BillboardStatus.IN_DEBT,
              });
              billboardsUpdated++;

              // Notify client
              if (billboard.client?.user) {
                await this.notificationsService.create(
                  billboard.client.user.id,
                  NotificationType.ALERT,
                  'Painel em Dívida',
                  `O painel ${billboard.code} encontra-se em dívida. Valor pendente: ${debtInfo.totalWithPenaltiesAndTax.toFixed(2)} MT (${debtInfo.yearsInDebt} ${debtInfo.yearsInDebt === 1 ? 'ano' : 'anos'} de atraso).`,
                  {
                    billboardId: billboard.id,
                    billboardCode: billboard.code,
                    debtAmount: debtInfo.totalWithPenaltiesAndTax,
                    yearsInDebt: debtInfo.yearsInDebt,
                  },
                  true, // Send email
                );
                notificationsSent++;
              }
            }
          } else if (debtInfo.currentDebt === 0 && billboard.status === BillboardStatus.IN_DEBT) {
            // Reset to ACTIVE if debt was paid
            await this.billboardRepository.update(billboard.id, {
              status: BillboardStatus.ACTIVE,
            });
            billboardsUpdated++;
          }
        } catch (error) {
          this.logger.error(`Error processing overdue payment for billboard ${billboard.id}: ${error.message}`);
        }
      }

      this.logger.log(
        `Overdue payments check completed. Updated ${billboardsUpdated} billboards, sent ${notificationsSent} notifications.`
      );
    } catch (error) {
      this.logger.error(`Error in checkOverduePayments: ${error.message}`, error.stack);
    }
  }

  /**
   * Run every Monday at 8:00 AM to send weekly summary to admins
   */
  @Cron(CronExpression.MONDAY_TO_FRIDAY_AT_8AM)
  async sendWeeklySummaryToAdmins() {
    this.logger.log('Sending weekly summary to admins...');

    try {
      const pendingPayments = await this.paymentRepository.count({
        where: { status: PaymentStatus.PENDING },
      });

      const billboardsInDebt = await this.billboardRepository.count({
        where: { status: BillboardStatus.IN_DEBT },
      });

      const activeBillboards = await this.billboardRepository.count({
        where: { status: BillboardStatus.ACTIVE, isActive: true },
      });

      // Get admin users
      const { Repository } = require('typeorm');
      const { User } = require('../users/user.entity');
      const userRepository: Repository<any> = this.billboardRepository.manager.getRepository('User');
      
      const admins = await userRepository.find({
        where: [
          { role: 'admin' },
          { role: 'finance' },
        ],
      });

      for (const admin of admins) {
        await this.notificationsService.create(
          admin.id,
          NotificationType.SYSTEM,
          'Resumo Semanal do Sistema',
          `Resumo semanal:\n- Painéis ativos: ${activeBillboards}\n- Painéis em dívida: ${billboardsInDebt}\n- Pagamentos pendentes: ${pendingPayments}`,
          {
            activeBillboards,
            billboardsInDebt,
            pendingPayments,
            date: new Date(),
          },
          false, // Don't send email for weekly summary
        );
      }

      this.logger.log(`Weekly summary sent to ${admins.length} admins.`);
    } catch (error) {
      this.logger.error(`Error in sendWeeklySummaryToAdmins: ${error.message}`, error.stack);
    }
  }

  /**
   * Run every day at 11:00 AM to check for expired billboards
   * Notifies clients 30 days before, 15 days before, and on expiry date
   */
  @Cron(CronExpression.EVERY_DAY_AT_11AM)
  async checkExpiredBillboards() {
    this.logger.log('Running scheduled check for expired billboards...');

    try {
      const billboards = await this.billboardRepository.find({
        where: { 
          isActive: true,
        },
        relations: ['client', 'client.user'],
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      
      const fifteenDaysFromNow = new Date(today);
      fifteenDaysFromNow.setDate(today.getDate() + 15);

      let notificationsSent = 0;
      let billboardsExpired = 0;

      for (const billboard of billboards) {
        if (!billboard.contractExpiryDate) continue;

        const expiryDate = new Date(billboard.contractExpiryDate);
        expiryDate.setHours(0, 0, 0, 0);

        // Skip if already expired and status updated
        if (expiryDate < today && billboard.status === BillboardStatus.INACTIVE) {
          continue;
        }

        // Billboard expired today - update status and notify
        if (expiryDate.getTime() === today.getTime()) {
          await this.billboardRepository.update(billboard.id, {
            status: BillboardStatus.INACTIVE,
          });
          billboardsExpired++;

          if (billboard.client?.user) {
            await this.notificationsService.create(
              billboard.client.user.id,
              NotificationType.BILLBOARD_EXPIRED,
              'Contrato de Painel Expirado',
              `O contrato do painel ${billboard.code} expirou hoje. Por favor, entre em contato para renovação.`,
              {
                billboardId: billboard.id,
                billboardCode: billboard.code,
                expiryDate: expiryDate,
              },
              true, // Send email
            );
            notificationsSent++;
          }

          // Notify admins
          await this.notifyAdminsAboutExpiredBillboard(billboard);
        }
        // Billboard expires in 15 days - send reminder
        else if (expiryDate.getTime() === fifteenDaysFromNow.getTime()) {
          if (billboard.client?.user) {
            await this.notificationsService.create(
              billboard.client.user.id,
              NotificationType.ALERT,
              'Contrato de Painel a Expirar em Breve',
              `O contrato do painel ${billboard.code} expira em 15 dias (${expiryDate.toISOString().split('T')[0]}). Entre em contato para renovação.`,
              {
                billboardId: billboard.id,
                billboardCode: billboard.code,
                expiryDate: expiryDate,
                daysUntilExpiry: 15,
              },
              true, // Send email
            );
            notificationsSent++;
          }
        }
        // Billboard expires in 30 days - send first reminder
        else if (expiryDate.getTime() === thirtyDaysFromNow.getTime()) {
          if (billboard.client?.user) {
            await this.notificationsService.create(
              billboard.client.user.id,
              NotificationType.ALERT,
              'Lembrete: Contrato de Painel a Expirar',
              `O contrato do painel ${billboard.code} expira em 30 dias (${expiryDate.toISOString().split('T')[0]}). Recomendamos iniciar o processo de renovação.`,
              {
                billboardId: billboard.id,
                billboardCode: billboard.code,
                expiryDate: expiryDate,
                daysUntilExpiry: 30,
              },
              true, // Send email
            );
            notificationsSent++;
          }
        }
      }

      this.logger.log(
        `Expired billboards check completed. Expired: ${billboardsExpired}, Notifications sent: ${notificationsSent}`
      );
    } catch (error) {
      this.logger.error(`Error in checkExpiredBillboards: ${error.message}`, error.stack);
    }
  }

  /**
   * Notificar admins sobre painel expirado
   */
  private async notifyAdminsAboutExpiredBillboard(billboard: Billboard): Promise<void> {
    try {
      const { Repository } = require('typeorm');
      const { User } = require('../users/user.entity');
      const userRepository: Repository<any> = this.billboardRepository.manager.getRepository('User');
      
      const admins = await userRepository.find({
        where: [
          { role: 'admin' },
          { role: 'technician' },
        ],
      });

      for (const admin of admins) {
        await this.notificationsService.create(
          admin.id,
          NotificationType.SYSTEM,
          'Painel Expirado',
          `O painel ${billboard.code} (Cliente: ${billboard.client?.companyName || 'N/A'}) expirou e foi marcado como INATIVO.`,
          {
            billboardId: billboard.id,
            billboardCode: billboard.code,
            clientId: billboard.client?.id,
            clientName: billboard.client?.companyName,
          },
          false,
        );
      }
    } catch (error) {
      this.logger.error(`Error notifying admins about expired billboard: ${error.message}`);
    }
  }
}

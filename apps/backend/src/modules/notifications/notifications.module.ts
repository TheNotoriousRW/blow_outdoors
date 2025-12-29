import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Notification } from './notification.entity';
import { Billboard } from '../billboards/billboard.entity';
import { Payment } from '../payments/payment.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { DebtCalculationService } from '../payments/debt-calculation.service';
import { Tariff } from '../tariffs/tariff.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Billboard, Payment, Tariff]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService, 
    NotificationsProcessor,
    NotificationSchedulerService,
    DebtCalculationService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}

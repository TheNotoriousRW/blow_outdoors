import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Billboard } from '../billboards/billboard.entity';
import { Payment } from '../payments/payment.entity';
import { Invoice } from '../invoices/invoice.entity';
import { Notification } from '../notifications/notification.entity';
import { Client } from '../clients/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Billboard,
      Payment,
      Invoice,
      Notification,
      Client,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

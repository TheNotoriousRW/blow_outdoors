import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PdfReportGeneratorService } from './pdf-report-generator.service';
import { ClientsModule } from '../clients/clients.module';
import { Payment } from '../payments/payment.entity';
import { Billboard } from '../billboards/billboard.entity';
import { Client } from '../clients/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Billboard, Client]),
    ClientsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, PdfReportGeneratorService],
  exports: [ReportsService],
})
export class ReportsModule {}

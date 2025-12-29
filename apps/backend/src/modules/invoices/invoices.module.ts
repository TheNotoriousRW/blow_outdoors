import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './invoice.entity';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { ClientsModule } from '../clients/clients.module';
import { BillboardsModule } from '../billboards/billboards.module';
import { PdfGeneratorService } from './pdf-generator.service';
import { ProformaGeneratorService } from './proforma-generator.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';
import { TariffsModule } from '../tariffs/tariffs.module';
import { Billboard } from '../billboards/billboard.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Billboard]),
    ClientsModule,
    forwardRef(() => BillboardsModule),
    NotificationsModule,
    AuditModule,
    TariffsModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, PdfGeneratorService, ProformaGeneratorService],
  exports: [InvoicesService, ProformaGeneratorService],
})
export class InvoicesModule {}

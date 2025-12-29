import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Payment } from './payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { DebtCalculationService } from './debt-calculation.service';
import { ClientsModule } from '../clients/clients.module';
import { BillboardsModule } from '../billboards/billboards.module';
import { Billboard } from '../billboards/billboard.entity';
import { Tariff } from '../tariffs/tariff.entity';
import { User } from '../users/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Billboard, Tariff, User]),
    ClientsModule,
    BillboardsModule,
    NotificationsModule,
    InvoicesModule,
    AuditModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: diskStorage({
          destination: configService.get('UPLOAD_LOCATION', './uploads'),
          filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            const filename = `payment-proof-${uniqueSuffix}${ext}`;
            callback(null, filename);
          },
        }),
        limits: {
          fileSize: configService.get('MAX_FILE_SIZE', 10485760),
        },
        fileFilter: (req, file, callback) => {
          const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/webp'];
          if (allowedMimes.includes(file.mimetype)) {
            callback(null, true);
          } else {
            callback(new Error('Invalid file type. Only JPEG, PNG, WEBP, and PDF allowed.'), false);
          }
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, DebtCalculationService],
  exports: [PaymentsService, DebtCalculationService],
})
export class PaymentsModule {}

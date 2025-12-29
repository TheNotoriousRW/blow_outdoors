import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TariffZone } from './tariff-zone.entity';
import { TariffZonesService } from './tariff-zones.service';
import { TariffZonesController } from './tariff-zones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TariffZone])],
  controllers: [TariffZonesController],
  providers: [TariffZonesService],
  exports: [TariffZonesService],
})
export class TariffZonesModule {}

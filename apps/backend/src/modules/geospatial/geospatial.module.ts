import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeospatialController } from './geospatial.controller';
import { GeospatialService } from './geospatial.service';
import { Billboard } from '../billboards/billboard.entity';
import { TariffZone } from '../tariff-zones/tariff-zone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Billboard, TariffZone])],
  controllers: [GeospatialController],
  providers: [GeospatialService],
  exports: [GeospatialService],
})
export class GeospatialModule {}

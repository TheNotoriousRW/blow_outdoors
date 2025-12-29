import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TariffZonesService } from './tariff-zones.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Tariff Zones')
@ApiBearerAuth('JWT-auth')
@Controller('tariff-zones')
export class TariffZonesController {
  constructor(private readonly tariffZonesService: TariffZonesService) {}

  @Get()
  async findAll() {
    return this.tariffZonesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tariffZonesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() data: any) {
    return this.tariffZonesService.create(data);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() data: any) {
    return this.tariffZonesService.update(id, data);
  }
}

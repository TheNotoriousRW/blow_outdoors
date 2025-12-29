import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TariffsService } from './tariffs.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Tariffs')
@ApiBearerAuth('JWT-auth')
@Controller('tariffs')
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @Get()
  async findAll() {
    return this.tariffsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tariffsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  async create(@Body() data: any) {
    return this.tariffsService.create(data);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  async update(@Param('id') id: string, @Body() data: any) {
    return this.tariffsService.update(id, data);
  }
}

import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { BillboardsService } from './billboards.service';
import { ClientsService } from '../clients/clients.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, BillboardStatus } from '../../common/enums';

@ApiTags('Billboards')
@ApiBearerAuth('JWT-auth')
@Controller('billboards')
export class BillboardsController {
  constructor(
    private readonly billboardsService: BillboardsService,
    private readonly clientsService: ClientsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all billboards with optional filters' })
  @ApiQuery({ name: 'status', required: false, enum: BillboardStatus })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'district', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiResponse({ status: 200, description: 'Billboards retrieved successfully' })
  async findAll(
    @Query('status') status?: BillboardStatus,
    @Query('clientId') queryClientId?: string,
    @Query('district') district?: string,
    @Query('type') type?: string,
    @Req() req?: any,
  ) {
    // If user is CLIENT, force filter by their clientId
    let clientId = queryClientId;
    if (req?.user?.role === UserRole.CLIENT) {
      const client = await this.clientsService.findByUserId(req.user.sub);
      clientId = client?.id;
    }
    
    return this.billboardsService.findAll({ status, clientId, district, type });
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find billboards near a location' })
  @ApiQuery({ name: 'longitude', required: true })
  @ApiQuery({ name: 'latitude', required: true })
  @ApiQuery({ name: 'radiusKm', required: false })
  @ApiResponse({ status: 200, description: 'Nearby billboards retrieved' })
  async findNearby(
    @Query('longitude') longitude: number,
    @Query('latitude') latitude: number,
    @Query('radiusKm') radiusKm?: number,
  ) {
    return this.billboardsService.findNearby(longitude, latitude, radiusKm);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get billboard by ID with full details' })
  @ApiResponse({ status: 200, description: 'Billboard found with payment history and debt calculation' })
  @ApiResponse({ status: 404, description: 'Billboard not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - CLIENT can only view own billboards' })
  async findOne(@Param('id') id: string, @Req() req?: any) {
    // Use detailed view with debt calculation and payment history
    const billboard = await this.billboardsService.findOneWithDetails(id);
    
    // If user is CLIENT, verify ownership
    if (req?.user?.role === UserRole.CLIENT) {
      const client = await this.clientsService.findByUserId(req.user.sub);
      if (!client || billboard.client?.id !== client.id) {
        throw new Error('Forbidden: You can only view your own billboards');
      }
    }
    
    return billboard;
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Create new billboard with optional images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          description: 'JSON string with billboard data',
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Billboard images (max 5)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Billboard created successfully' })
  @UseInterceptors(FilesInterceptor('images', 5))
  async create(
    @Body('data') data: string,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    const createBillboardDto = data ? JSON.parse(data) : {};
    
    // Create GeoJSON Point from coordinates if latitude and longitude provided
    if (createBillboardDto.latitude && createBillboardDto.longitude) {
      createBillboardDto.location = {
        type: 'Point',
        coordinates: [createBillboardDto.longitude, createBillboardDto.latitude],
      };
    }
    
    // Add image filenames if uploaded
    if (images && images.length > 0) {
      createBillboardDto.images = images.map(img => img.filename);
    }
    
    return this.billboardsService.create(createBillboardDto);
  }

  @Post('create-from-map')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Create billboard from map click with optional image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          description: 'JSON string with billboard data (longitude, latitude, type, size, etc)',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Billboard image (optional)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Billboard created successfully from map coordinates' })
  @UseInterceptors(FileInterceptor('image'))
  async createFromMapClick(
    @Body('data') dataString: string,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const data = JSON.parse(dataString);
    // Create GeoJSON Point from coordinates
    const location = {
      type: 'Point' as const,
      coordinates: [data.longitude, data.latitude],
    };

    // Auto-generate code if not provided
    const code = data.code || `PAINEL-${Date.now().toString().slice(-6)}`;

    // Create billboard with location and image
    const billboardData = {
      ...data,
      code,
      name: data.name || `Painel ${code}`,
      location,
      status: 'pending', // Default status
      images: image ? [image.filename] : [],
    };

    return this.billboardsService.create(billboardData);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Update billboard' })
  @ApiResponse({ status: 200, description: 'Billboard updated successfully' })
  async update(@Param('id') id: string, @Body() updateBillboardDto: any) {
    return this.billboardsService.update(id, updateBillboardDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Update billboard status' })
  @ApiResponse({ status: 200, description: 'Billboard status updated' })
  async updateStatus(@Param('id') id: string, @Body('status') status: BillboardStatus) {
    return this.billboardsService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete billboard (set isActive to false)' })
  @ApiResponse({ status: 200, description: 'Billboard soft deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.billboardsService.remove(id);
    return { message: 'Billboard deleted successfully (soft delete)' };
  }

  @Patch(':id/restore')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Restore soft-deleted billboard' })
  @ApiResponse({ status: 200, description: 'Billboard restored successfully' })
  async restore(@Param('id') id: string) {
    const billboard = await this.billboardsService.restore(id);
    return { 
      message: 'Billboard restored successfully',
      billboard 
    };
  }

  @Delete(':id/permanent')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Permanently delete billboard (hard delete - use with caution)' })
  @ApiResponse({ status: 200, description: 'Billboard permanently deleted' })
  async permanentlyDelete(@Param('id') id: string) {
    await this.billboardsService.permanentlyDelete(id);
    return { message: 'Billboard permanently deleted' };
  }
}

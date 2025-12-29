import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GeospatialService } from './geospatial.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';
import { User } from '../users/user.entity';

@ApiTags('Geospatial')
@ApiBearerAuth('JWT-auth')
@Controller('geospatial')
export class GeospatialController {
  constructor(private readonly geospatialService: GeospatialService) {}

  @Get('billboards/geojson')
  @ApiOperation({ summary: 'Get billboards as GeoJSON (filtered by client for CLIENT role)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'GeoJSON FeatureCollection returned' })
  async getBillboardsGeoJSON(
    @Query('status') status?: string,
    @Req() req?: any,
  ) {
    // If user is CLIENT, filter by their clientId
    let clientId: string | undefined;
    if (req?.user?.role === UserRole.CLIENT) {
      // Get clientId from user's client record
      const clientRepository = this.geospatialService['billboardRepository'].manager.getRepository('Client');
      const client = await clientRepository.findOne({
        where: { user: { id: req.user.sub } },
      });
      clientId = client?.id;
    }

    return this.geospatialService.getBillboardsAsGeoJSON({ clientId, status });
  }

  @Get('tariff-zones/geojson')
  @ApiOperation({ summary: 'Get tariff zones as GeoJSON' })
  @ApiResponse({ status: 200, description: 'GeoJSON FeatureCollection returned' })
  async getTariffZonesGeoJSON() {
    return this.geospatialService.getTariffZonesAsGeoJSON();
  }

  @Post('billboards/in-polygon')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Find billboards within a polygon' })
  @ApiResponse({ status: 200, description: 'Billboards within polygon returned' })
  async findInPolygon(@Body('polygon') polygon: any) {
    return this.geospatialService.findBillboardsInPolygon(polygon);
  }

  @Get('distance')
  @ApiOperation({ summary: 'Calculate distance between two points' })
  @ApiResponse({ status: 200, description: 'Distance calculated in meters' })
  async calculateDistance(
    @Query('fromLon') fromLon: number,
    @Query('fromLat') fromLat: number,
    @Query('toLon') toLon: number,
    @Query('toLat') toLat: number,
  ) {
    const distance = await this.geospatialService.calculateDistance(
      { longitude: fromLon, latitude: fromLat },
      { longitude: toLon, latitude: toLat },
    );

    return {
      distance,
      unit: 'meters',
      distanceKm: (distance / 1000).toFixed(2),
    };
  }

  @Get('billboards/clustered')
  @ApiOperation({ summary: 'Get billboards clustered for map visualization' })
  @ApiQuery({ name: 'zoom', required: true, description: 'Map zoom level (1-20)' })
  @ApiResponse({ status: 200, description: 'Clustered GeoJSON returned' })
  async getBillboardsClustered(
    @Query('zoom') zoom: number,
    @Req() req?: any,
  ) {
    // If user is CLIENT, filter by their clientId
    let clientId: string | undefined;
    if (req?.user?.role === UserRole.CLIENT) {
      const clientRepository = this.geospatialService['billboardRepository'].manager.getRepository('Client');
      const client = await clientRepository.findOne({
        where: { user: { id: req.user.sub } },
      });
      clientId = client?.id;
    }

    return this.geospatialService.getBillboardsClustered(Number(zoom), { clientId });
  }

  @Get('tariff-zone/by-coordinates')
  @ApiOperation({ summary: 'Find tariff zone containing the given coordinates' })
  @ApiQuery({ name: 'longitude', required: true })
  @ApiQuery({ name: 'latitude', required: true })
  @ApiResponse({ status: 200, description: 'Tariff zone found or null' })
  async getTariffZoneByCoordinates(
    @Query('longitude') longitude: number,
    @Query('latitude') latitude: number,
  ) {
    const zone = await this.geospatialService.findTariffZoneByCoordinates(
      Number(longitude),
      Number(latitude),
    );
    return zone;
  }

  @Get('validate-location')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Validate location for new billboard (Admin/Technician only)' })
  @ApiQuery({ name: 'longitude', required: true })
  @ApiQuery({ name: 'latitude', required: true })
  @ApiQuery({ name: 'minimumDistance', required: false, description: 'Minimum distance in meters (default: 50)' })
  @ApiResponse({ status: 200, description: 'Validation result returned' })
  async validateLocation(
    @Query('longitude') longitude: number,
    @Query('latitude') latitude: number,
    @Query('minimumDistance') minimumDistance?: number,
  ) {
    return this.geospatialService.validateBillboardLocation(
      Number(longitude),
      Number(latitude),
      minimumDistance ? Number(minimumDistance) : 50,
    );
  }

  @Get('nearby-billboards')
  @ApiOperation({ summary: 'Get billboards near a location' })
  @ApiQuery({ name: 'longitude', required: true })
  @ApiQuery({ name: 'latitude', required: true })
  @ApiQuery({ name: 'radius', required: false, description: 'Radius in meters (default: 100)' })
  @ApiResponse({ status: 200, description: 'Nearby billboards returned' })
  async getNearbyBillboards(
    @Query('longitude') longitude: number,
    @Query('latitude') latitude: number,
    @Query('radius') radius?: number,
  ) {
    return this.geospatialService.getNearbyBillboards(
      Number(longitude),
      Number(latitude),
      radius ? Number(radius) : 100,
    );
  }
}

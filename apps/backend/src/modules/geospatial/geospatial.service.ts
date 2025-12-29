import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Billboard } from '../billboards/billboard.entity';
import { TariffZone } from '../tariff-zones/tariff-zone.entity';

@Injectable()
export class GeospatialService {
  constructor(
    @InjectRepository(Billboard)
    private readonly billboardRepository: Repository<Billboard>,
    @InjectRepository(TariffZone)
    private readonly tariffZoneRepository: Repository<TariffZone>,
  ) {}

  /**
   * Get all billboards as GeoJSON FeatureCollection
   * If clientId is provided, filter by client (for CLIENT role users)
   */
  async getBillboardsAsGeoJSON(filters?: { clientId?: string; status?: string }): Promise<any> {
    const query = this.billboardRepository
      .createQueryBuilder('billboard')
      .leftJoinAndSelect('billboard.client', 'client')
      .leftJoinAndSelect('billboard.tariffZone', 'tariffZone')
      .where('billboard.isActive = :isActive', { isActive: true });

    // Filter by client if provided (for CLIENT role)
    if (filters?.clientId) {
      query.andWhere('billboard.clientId = :clientId', { clientId: filters.clientId });
    }

    // Filter by status if provided
    if (filters?.status) {
      query.andWhere('billboard.status = :status', { status: filters.status });
    }

    const billboards = await query.getMany();

    const features = billboards.map((billboard) => ({
      type: 'Feature',
      geometry: billboard.location,
      properties: {
        id: billboard.id,
        code: billboard.code,
        name: billboard.name,
        type: billboard.type,
        size: billboard.size,
        status: billboard.status,
        address: billboard.address,
        district: billboard.district,
        neighborhood: billboard.neighborhood,
        client: billboard.client
          ? {
              id: billboard.client.id,
              companyName: billboard.client.companyName,
            }
          : null,
        tariffZone: billboard.tariffZone
          ? {
              id: billboard.tariffZone.id,
              name: billboard.tariffZone.name,
              code: billboard.tariffZone.code,
            }
          : null,
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  /**
   * Get tariff zones as GeoJSON FeatureCollection
   */
  async getTariffZonesAsGeoJSON(): Promise<any> {
    const zones = await this.tariffZoneRepository.find();

    const features = zones.map((zone) => ({
      type: 'Feature',
      geometry: zone.geometry,
      properties: {
        id: zone.id,
        name: zone.name,
        code: zone.code,
        description: zone.description,
        districts: zone.districts,
        isActive: zone.isActive,
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  /**
   * Find billboards within a polygon
   */
  async findBillboardsInPolygon(polygon: any): Promise<Billboard[]> {
    return this.billboardRepository
      .createQueryBuilder('billboard')
      .where(
        `ST_Within(
          billboard.location::geometry,
          ST_GeomFromGeoJSON(:polygon)
        )`,
        { polygon: JSON.stringify(polygon) },
      )
      .getMany();
  }

  /**
   * Calculate distance between two points
   */
  async calculateDistance(
    from: { longitude: number; latitude: number },
    to: { longitude: number; latitude: number },
  ): Promise<number> {
    const result = await this.billboardRepository.query(
      `
      SELECT ST_Distance(
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
      ) as distance
      `,
      [from.longitude, from.latitude, to.longitude, to.latitude],
    );

    return result[0].distance; // Returns distance in meters
  }

  /**
   * Get billboards clustered by proximity for map visualization
   * Returns aggregated data for better map performance
   */
  async getBillboardsClustered(zoomLevel: number, filters?: { clientId?: string }): Promise<any> {
    // At high zoom levels (>12), return individual billboards
    if (zoomLevel > 12) {
      return this.getBillboardsAsGeoJSON(filters);
    }

    // At low zoom levels, cluster billboards within grid cells
    const gridSize = zoomLevel < 8 ? 1.0 : zoomLevel < 10 ? 0.5 : 0.1; // degrees

    let query = `
      SELECT 
        ST_X(ST_Centroid(ST_Collect(location::geometry))) as longitude,
        ST_Y(ST_Centroid(ST_Collect(location::geometry))) as latitude,
        COUNT(*) as count,
        array_agg(id) as billboard_ids,
        array_agg(status) as statuses
      FROM billboards
      WHERE "isActive" = true
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.clientId) {
      query += ` AND "clientId" = $${paramIndex}`;
      params.push(filters.clientId);
      paramIndex++;
    }

    query += `
      GROUP BY 
        floor(ST_X(location::geometry) / $${paramIndex}),
        floor(ST_Y(location::geometry) / $${paramIndex + 1})
    `;
    params.push(gridSize, gridSize);

    const clusters = await this.billboardRepository.query(query, params);

    const features = clusters.map((cluster) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(cluster.longitude), parseFloat(cluster.latitude)],
      },
      properties: {
        cluster: true,
        count: parseInt(cluster.count),
        billboardIds: cluster.billboard_ids,
        statuses: cluster.statuses,
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  /**
   * Find which tariff zone contains the given coordinates
   * Useful for validating billboard location before creation
   */
  async findTariffZoneByCoordinates(
    longitude: number,
    latitude: number,
  ): Promise<TariffZone | null> {
    const zones = await this.tariffZoneRepository
      .createQueryBuilder('zone')
      .where(
        `ST_Contains(
          zone.geometry::geometry,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)
        )`,
        { longitude, latitude },
      )
      .andWhere('zone.isActive = :isActive', { isActive: true })
      .getOne();

    return zones;
  }

  /**
   * Get nearby billboards within radius (for checking proximity before creating new billboard)
   */
  async getNearbyBillboards(
    longitude: number,
    latitude: number,
    radiusMeters: number = 100,
  ): Promise<Billboard[]> {
    return this.billboardRepository
      .createQueryBuilder('billboard')
      .leftJoinAndSelect('billboard.client', 'client')
      .where(
        `ST_DWithin(
          billboard.location::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius
        )`,
        { longitude, latitude, radius: radiusMeters },
      )
      .andWhere('billboard.isActive = :isActive', { isActive: true })
      .getMany();
  }

  /**
   * Validate location for new billboard
   * Returns validation result with tariff zone info and nearby billboards
   */
  async validateBillboardLocation(
    longitude: number,
    latitude: number,
    minimumDistance: number = 50, // meters
  ): Promise<{
    valid: boolean;
    tariffZone: TariffZone | null;
    nearbyBillboards: Billboard[];
    warnings: string[];
  }> {
    const warnings: string[] = [];

    // Check if location is within a tariff zone
    const tariffZone = await this.findTariffZoneByCoordinates(longitude, latitude);
    if (!tariffZone) {
      warnings.push('Localização fora das zonas tarifárias definidas');
    }

    // Check for nearby billboards
    const nearbyBillboards = await this.getNearbyBillboards(
      longitude,
      latitude,
      minimumDistance,
    );

    if (nearbyBillboards.length > 0) {
      warnings.push(
        `Existem ${nearbyBillboards.length} painel(is) num raio de ${minimumDistance}m`,
      );
    }

    return {
      valid: warnings.length === 0,
      tariffZone,
      nearbyBillboards,
      warnings,
    };
  }
}

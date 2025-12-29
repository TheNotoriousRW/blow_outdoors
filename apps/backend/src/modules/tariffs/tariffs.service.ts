import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tariff } from './tariff.entity';

@Injectable()
export class TariffsService {
  constructor(
    @InjectRepository(Tariff)
    private readonly tariffRepository: Repository<Tariff>,
  ) {}

  async findAll(): Promise<Tariff[]> {
    return this.tariffRepository.find({ relations: ['zone'] });
  }

  async findOne(id: string): Promise<Tariff | null> {
    return this.tariffRepository.findOne({ where: { id }, relations: ['zone'] });
  }

  async create(data: any): Promise<any> {
    // Handle tariffZoneId if provided
    if (data.tariffZoneId) {
      data.zone = { id: data.tariffZoneId };
      delete data.tariffZoneId;
    }

    // Auto-generate name if not provided
    if (!data.name) {
      const typeName = data.billboardType || 'Billboard';
      const zoneName = data.zone?.name || 'Zone';
      data.name = `${typeName}-${zoneName}`.toUpperCase();
    }

    const tariff = this.tariffRepository.create(data);
    const saved: any = await this.tariffRepository.save(tariff);
    // Return with zone relation populated
    const id = Array.isArray(saved) ? saved[0].id : saved.id;
    return this.findOne(id);
  }

  async update(id: string, data: any): Promise<Tariff | null> {
    // Create a clean update object
    const updateData: any = {};
    
    // Handle tariffZoneId if provided - convert to direct column update
    if (data.tariffZoneId) {
      updateData.zoneId = data.tariffZoneId;
    }
    
    // Copy allowed fields
    const allowedFields = ['name', 'billboardType', 'pricePerSquareMeterPerYear', 'description', 'isActive', 'validFrom', 'validUntil'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }
    
    await this.tariffRepository.update(id, updateData);
    return this.findOne(id);
  }

  /**
   * Find applicable tariff for a billboard based on zone and type
   */
  async findApplicableTariff(
    tariffZoneId: string,
    billboardType: string,
  ): Promise<Tariff | null> {
    const tariff = await this.tariffRepository
      .createQueryBuilder('tariff')
      .leftJoinAndSelect('tariff.zone', 'zone')
      .where('tariff.zoneId = :tariffZoneId', { tariffZoneId })
      .andWhere('tariff.billboardType = :billboardType', { billboardType })
      .andWhere('tariff.isActive = :isActive', { isActive: true })
      .orderBy('tariff.createdAt', 'DESC')
      .getOne();

    return tariff;
  }

  /**
   * Calculate annual rate per square meter for a billboard
   * Returns the price per m² per year from the applicable tariff
   */
  async calculateAnnualRate(
    tariffZoneId: string,
    billboardType: string,
  ): Promise<{
    tariff: Tariff | null;
    pricePerSquareMeterPerYear: number;
    calculatedAnnualRate: number;
  }> {
    const tariff = await this.findApplicableTariff(tariffZoneId, billboardType);

    if (!tariff) {
      return {
        tariff: null,
        pricePerSquareMeterPerYear: 0,
        calculatedAnnualRate: 0,
      };
    }

    const pricePerSquareMeterPerYear = Number(tariff.pricePerSquareMeterPerYear);

    return {
      tariff,
      pricePerSquareMeterPerYear,
      calculatedAnnualRate: pricePerSquareMeterPerYear, // Will be multiplied by area when calculating billboard fee
    };
  }
}

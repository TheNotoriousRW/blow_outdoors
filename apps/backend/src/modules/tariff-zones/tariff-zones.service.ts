import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TariffZone } from './tariff-zone.entity';

@Injectable()
export class TariffZonesService {
  constructor(
    @InjectRepository(TariffZone)
    private readonly tariffZoneRepository: Repository<TariffZone>,
  ) {}

  async findAll(): Promise<TariffZone[]> {
    return this.tariffZoneRepository.find();
  }

  async findOne(id: string): Promise<TariffZone | null> {
    return this.tariffZoneRepository.findOne({ where: { id } });
  }

  async create(data: any): Promise<TariffZone> {
    // Auto-generate code if not provided
    if (!data.code && data.name) {
      data.code = data.name
        .toUpperCase()
        .replace(/\s+/g, '-')
        .replace(/[^A-Z0-9-]/g, '');
    }
    
    const zone = this.tariffZoneRepository.create(data);
    return await this.tariffZoneRepository.save(zone) as unknown as TariffZone;
  }

  async update(id: string, data: any): Promise<TariffZone | null> {
    await this.tariffZoneRepository.update(id, data);
    return this.findOne(id);
  }
}

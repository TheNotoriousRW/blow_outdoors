import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { TariffZone } from '../tariff-zones/tariff-zone.entity';
import { BillboardType } from '../../common/enums';

@Entity('tariffs')
export class Tariff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @ManyToOne(() => TariffZone, (zone) => zone.tariffs, { nullable: true })
  zone: TariffZone;

  @Column({ nullable: true })
  zoneId: string;

  @Column({
    type: 'enum',
    enum: BillboardType,
  })
  billboardType: BillboardType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerSquareMeterPerYear: number; // Price per m² per year in MT

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  validFrom: Date;

  @Column({ type: 'date', nullable: true })
  validUntil: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

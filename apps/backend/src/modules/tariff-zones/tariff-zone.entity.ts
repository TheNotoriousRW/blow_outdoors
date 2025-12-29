import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { MultiPolygon } from 'geojson';
import { Billboard } from '../billboards/billboard.entity';
import { Tariff } from '../tariffs/tariff.entity';

@Entity('tariff_zones')
export class TariffZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true, nullable: true })
  code: string; // e.g., "ZONE-A", "ZONE-B"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'MultiPolygon',
    srid: 4326,
    nullable: true,
  })
  geometry: MultiPolygon;

  @Column({ type: 'simple-array', nullable: true })
  districts: string[]; // List of districts in this zone

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Billboard, (billboard) => billboard.tariffZone)
  billboards: Billboard[];

  @OneToMany(() => Tariff, (tariff) => tariff.zone)
  tariffs: Tariff[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

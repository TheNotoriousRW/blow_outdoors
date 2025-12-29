import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Point } from 'geojson';
import { Client } from '../clients/client.entity';
import { TariffZone } from '../tariff-zones/tariff-zone.entity';
import { Payment } from '../payments/payment.entity';
import { BillboardStatus, BillboardType, BillboardSize } from '../../common/enums';

@Entity('billboards')
export class Billboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // Unique identifier for the billboard

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: BillboardType,
    default: BillboardType.OUTDOOR,
  })
  type: BillboardType;

  @Column({
    type: 'enum',
    enum: BillboardSize,
    default: BillboardSize.MEDIUM,
  })
  size: BillboardSize;

  @Column({
    type: 'enum',
    enum: BillboardStatus,
    default: BillboardStatus.PENDING,
  })
  status: BillboardStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width: number; // in meters

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  height: number; // in meters

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area: number; // in square meters (calculated: width * height)

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  annualFee: number; // Annual fee in MT (calculated: area * pricePerSquareMeterPerYear)

  @Column()
  address: string;

  @Column({ nullable: true })
  street: string;

  @Column({ nullable: true })
  neighborhood: string; // Bairro

  @Column({ nullable: true })
  district: string; // Distrito

  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: Point;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[]; // Array of image URLs

  @ManyToOne(() => Client, (client) => client.billboards)
  client: Client;

  @Column({ nullable: true })
  clientId: string;

  @ManyToOne(() => TariffZone, (zone) => zone.billboards, { nullable: true })
  tariffZone: TariffZone;

  @Column({ nullable: true })
  tariffZoneId: string;

  @OneToMany(() => Payment, (payment) => payment.billboard)
  payments: Payment[];

  @Column({ type: 'date', nullable: true })
  installationDate: Date;

  @Column({ type: 'date', nullable: true })
  lastInspectionDate: Date;

  @Column({ type: 'date', nullable: true })
  nextDueDate: Date;

  @Column({ type: 'date', nullable: true })
  contractExpiryDate: Date; // Data de expiração do contrato

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

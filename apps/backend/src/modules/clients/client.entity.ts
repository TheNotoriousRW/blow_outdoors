import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Billboard } from '../billboards/billboard.entity';
import { Payment } from '../payments/payment.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column()
  companyName: string;

  @Column({ unique: true })
  taxId: string; // NUIT in Mozambique

  @Column()
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  alternativePhone: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Billboard, (billboard) => billboard.client)
  billboards: Billboard[];

  @OneToMany(() => Payment, (payment) => payment.client)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

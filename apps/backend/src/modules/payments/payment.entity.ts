import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { Billboard } from '../billboards/billboard.entity';
import { Invoice } from '../invoices/invoice.entity';
import { PaymentStatus, PaymentMethod } from '../../common/enums';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  referenceNumber: string;

  @Column({ type: 'uuid', nullable: true })
  clientId: string;

  @ManyToOne(() => Client, (client) => client.payments)
  client: Client;

  @Column({ type: 'uuid', nullable: true })
  billboardId: string;

  @ManyToOne(() => Billboard, (billboard) => billboard.payments)
  billboard: Billboard;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ type: 'date' })
  paymentDate: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  proofDocument: string; // URL to uploaded proof

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  validatedBy: string; // User ID who validated

  @Column({ type: 'timestamp', nullable: true })
  validatedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @OneToMany(() => Invoice, (invoice) => invoice.payment)
  invoices: Invoice[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

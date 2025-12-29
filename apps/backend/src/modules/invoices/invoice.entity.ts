import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Payment } from '../payments/payment.entity';
import { Client } from '../clients/client.entity';
import { Billboard } from '../billboards/billboard.entity';
import { InvoiceType, InvoiceStatus } from '../../common/enums';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column({
    type: 'enum',
    enum: InvoiceType,
    default: InvoiceType.INVOICE,
  })
  type: InvoiceType;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING,
  })
  status: InvoiceStatus;

  @ManyToOne(() => Payment, (payment) => payment.invoices, { nullable: true })
  payment?: Payment;

  @Column({ type: 'uuid', nullable: true })
  paymentId?: string;

  // Relação direta com cliente (obrigatório)
  @ManyToOne(() => Client)
  @JoinColumn()
  client: Client;

  @Column({ type: 'uuid' })
  clientId: string;

  // Relação com billboard (opcional)
  @ManyToOne(() => Billboard, { nullable: true })
  @JoinColumn()
  billboard?: Billboard;

  @Column({ type: 'uuid', nullable: true })
  billboardId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number; // IVA

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  fileUrl: string; // URL do arquivo PDF/imagem uploaded pelo admin

  @Column({ nullable: true })
  fileName: string; // Nome original do arquivo

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  notes: string; // Observações adicionais

  @Column({ type: 'uuid', nullable: true })
  issuedBy: string; // User ID (admin) que fez upload

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Billboard } from '../billboards/billboard.entity';
import { Payment } from '../payments/payment.entity';
import { Tariff } from '../tariffs/tariff.entity';
import { PaymentStatus } from '../../common/enums';

export interface DebtCalculation {
  billboardId: string;
  billboardCode: string;
  annualRate: number;
  installationDate: Date;
  yearsSinceInstall: number;
  totalOwed: number;
  totalPaid: number;
  currentDebt: number;
  yearsInDebt: number;
  penaltyAmount: number;
  taxAmount: number;
  totalWithPenaltiesAndTax: number;
  nextPaymentDue: Date | null;
  breakdown: {
    baseAmount: number;
    penalties: number;
    tax: number;
    total: number;
  };
}

@Injectable()
export class DebtCalculationService {
  constructor(
    @InjectRepository(Billboard)
    private readonly billboardRepository: Repository<Billboard>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Tariff)
    private readonly tariffRepository: Repository<Tariff>,
  ) {}

  /**
   * Calculate debt for a specific billboard
   */
  async calculateDebt(billboardId: string): Promise<DebtCalculation> {
    // Get billboard with relations
    const billboard = await this.billboardRepository.findOne({
      where: { id: billboardId },
      relations: ['tariffZone', 'payments'],
    });

    if (!billboard) {
      throw new Error(`Billboard with ID ${billboardId} not found`);
    }

    // Get applicable tariff
    let currentTariff: any = null;
    if (billboard.tariffZone) {
      currentTariff = await this.tariffRepository.findOne({
        where: {
          zoneId: billboard.tariffZone.id,
          billboardType: billboard.type,
          isActive: true,
        },
        order: { validFrom: 'DESC' },
      });
    }

    // Calculate annual fee from tariff or use billboard's stored annualFee
    const annualRate = billboard.annualFee 
      ? Number(billboard.annualFee) 
      : (currentTariff && billboard.area) 
        ? Number(currentTariff.pricePerSquareMeterPerYear) * Number(billboard.area)
        : 0;
    
    const penaltyRate = 2; // 2% per month as default penalty rate

    // Calculate years since installation
    const installDate = billboard.installationDate || billboard.createdAt;
    const now = new Date();
    const yearsSinceInstall = Math.max(1, Math.ceil(
      (now.getTime() - new Date(installDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
    ));

    // Calculate total owed based on annual rate
    const totalOwed = annualRate * yearsSinceInstall;

    // Get all validated payments
    const payments = billboard.payments || [];
    const validatedPayments = payments.filter(p => p.status === PaymentStatus.VALIDATED);
    const totalPaid = validatedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Calculate current debt
    const currentDebt = Math.max(0, totalOwed - totalPaid);
    const yearsInDebt = annualRate > 0 ? Math.floor(currentDebt / annualRate) : 0;

    // Calculate penalties (e.g., 2% per month in debt)
    const monthsInDebt = yearsInDebt * 12;
    const penaltyAmount = monthsInDebt > 0 ? (currentDebt * penaltyRate / 100) * monthsInDebt : 0;

    // Calculate tax (IVA 16%)
    const taxRate = 0.16;
    const taxAmount = (currentDebt + penaltyAmount) * taxRate;

    // Total with penalties and tax
    const totalWithPenaltiesAndTax = currentDebt + penaltyAmount + taxAmount;

    // Calculate next payment due date
    let nextPaymentDue: Date | null = null;
    if (currentDebt > 0) {
      nextPaymentDue = new Date();
      nextPaymentDue.setDate(1); // First day of current month
      if (nextPaymentDue < now) {
        nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);
      }
    }

    return {
      billboardId: billboard.id,
      billboardCode: billboard.code,
      annualRate,
      installationDate: new Date(installDate),
      yearsSinceInstall,
      totalOwed,
      totalPaid,
      currentDebt,
      yearsInDebt,
      penaltyAmount,
      taxAmount,
      totalWithPenaltiesAndTax,
      nextPaymentDue,
      breakdown: {
        baseAmount: currentDebt,
        penalties: penaltyAmount,
        tax: taxAmount,
        total: totalWithPenaltiesAndTax,
      },
    };
  }

  /**
   * Calculate debt for multiple billboards
   */
  async calculateDebtForClient(clientId: string): Promise<DebtCalculation[]> {
    const billboards = await this.billboardRepository.find({
      where: { client: { id: clientId } },
    });

    const calculations = await Promise.all(
      billboards.map(billboard => this.calculateDebt(billboard.id))
    );

    return calculations;
  }

  /**
   * Get summary of total debt for a client
   */
  async getClientDebtSummary(clientId: string): Promise<{
    totalBillboards: number;
    totalDebt: number;
    totalWithPenaltiesAndTax: number;
    billboardsInDebt: number;
  }> {
    const calculations = await this.calculateDebtForClient(clientId);

    return {
      totalBillboards: calculations.length,
      totalDebt: calculations.reduce((sum, calc) => sum + calc.currentDebt, 0),
      totalWithPenaltiesAndTax: calculations.reduce((sum, calc) => sum + calc.totalWithPenaltiesAndTax, 0),
      billboardsInDebt: calculations.filter(calc => calc.currentDebt > 0).length,
    };
  }
}

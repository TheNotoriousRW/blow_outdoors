import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payments/payment.entity';
import { Billboard } from '../billboards/billboard.entity';
import { Client } from '../clients/client.entity';
import { PaymentStatus } from '../../common/enums';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Billboard)
    private readonly billboardRepository: Repository<Billboard>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  /**
   * Get revenue report
   */
  async getRevenueReport(startDate?: Date, endDate?: Date, clientId?: string): Promise<any> {
    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'totalRevenue')
      .addSelect('COUNT(payment.id)', 'totalPayments')
      .addSelect('payment.status', 'status')
      .groupBy('payment.status');

    if (clientId) {
      query.andWhere('payment.clientId = :clientId', { clientId });
    }

    if (startDate) {
      query.andWhere('payment.paymentDate >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('payment.paymentDate <= :endDate', { endDate });
    }

    const results = await query.getRawMany();

    const totalRevenue = results.reduce(
      (sum, item) => sum + parseFloat(item.totalRevenue || 0),
      0,
    );

    return {
      totalRevenue,
      byStatus: results,
      period: { startDate, endDate },
    };
  }

  /**
   * Get billboards in debt
   */
  async getBillboardsInDebt(clientId?: string): Promise<any> {
    const query = this.billboardRepository
      .createQueryBuilder('billboard')
      .leftJoinAndSelect('billboard.client', 'client')
      .where('billboard.status = :status', { status: 'in_debt' });

    if (clientId) {
      query.andWhere('billboard.clientId = :clientId', { clientId });
    }

    const billboards = await query.getMany();

    return {
      total: billboards.length,
      billboards,
    };
  }

  /**
   * Get billboards by district
   */
  async getBillboardsByDistrict(clientId?: string): Promise<any> {
    const query = this.billboardRepository
      .createQueryBuilder('billboard')
      .select('billboard.district', 'district')
      .addSelect('COUNT(billboard.id)', 'count')
      .addSelect('billboard.status', 'status')
      .groupBy('billboard.district')
      .addGroupBy('billboard.status');

    if (clientId) {
      query.where('billboard.clientId = :clientId', { clientId });
    }

    const results = await query.getRawMany();

    return results;
  }

  /**
   * Get client statistics
   */
  async getClientStatistics(clientId?: string): Promise<any> {
    // If clientId is provided (CLIENT role), return only their statistics
    if (clientId) {
      const client = await this.clientRepository.findOne({ 
        where: { id: clientId },
        relations: ['billboards']
      });

      if (!client) {
        return {
          totalClients: 0,
          activeClients: 0,
          clientsWithBillboards: []
        };
      }

      return {
        totalClients: 1,
        activeClients: client.isActive ? 1 : 0,
        clientsWithBillboards: [{
          clientId: client.id,
          companyName: client.companyName,
          billboardCount: client.billboards?.length || 0
        }]
      };
    }

    // Admin/Finance: show all clients
    const totalClients = await this.clientRepository.count();
    const activeClients = await this.clientRepository.count({ where: { isActive: true } });

    const clientsWithBillboards = await this.clientRepository
      .createQueryBuilder('client')
      .leftJoin('client.billboards', 'billboard')
      .select('client.id', 'clientId')
      .addSelect('client.companyName', 'companyName')
      .addSelect('COUNT(billboard.id)', 'billboardCount')
      .groupBy('client.id')
      .addGroupBy('client.companyName')
      .getRawMany();

    return {
      totalClients,
      activeClients,
      clientsWithBillboards,
    };
  }

  /**
   * Generate CSV from revenue report
   */
  async generateRevenueCSV(startDate?: Date, endDate?: Date, clientId?: string): Promise<string> {
    const report = await this.getRevenueReport(startDate, endDate, clientId);
    
    let csv = 'Status,Total Revenue,Total Payments\n';
    
    for (const item of report.byStatus) {
      csv += `${item.status},${item.totalRevenue},${item.totalPayments}\n`;
    }
    
    csv += `\nTOTAL,${report.totalRevenue},${report.byStatus.reduce((sum, item) => sum + parseInt(item.totalPayments), 0)}\n`;
    csv += `\nPeriod: ${startDate ? startDate.toISOString().split('T')[0] : 'N/A'} to ${endDate ? endDate.toISOString().split('T')[0] : 'N/A'}`;
    
    return csv;
  }

  /**
   * Generate CSV from billboards in debt
   */
  async generateBillboardsInDebtCSV(clientId?: string): Promise<string> {
    const report = await this.getBillboardsInDebt(clientId);
    
    let csv = 'Code,Name,Type,Status,Address,District,Client Company\n';
    
    for (const billboard of report.billboards) {
      csv += `${billboard.code},${billboard.name},${billboard.type},${billboard.status},"${billboard.address}",${billboard.district || 'N/A'},${billboard.client?.companyName || 'N/A'}\n`;
    }
    
    csv += `\nTotal Billboards in Debt: ${report.total}`;
    
    return csv;
  }

  /**
   * Generate CSV from billboards by district
   */
  async generateBillboardsByDistrictCSV(clientId?: string): Promise<string> {
    const report = await this.getBillboardsByDistrict(clientId);
    
    let csv = 'District,Status,Count\n';
    
    for (const item of report) {
      csv += `${item.district || 'Unknown'},${item.status},${item.count}\n`;
    }
    
    return csv;
  }

  /**
   * Generate CSV from client statistics
   */
  async generateClientStatisticsCSV(clientId?: string): Promise<string> {
    const report = await this.getClientStatistics(clientId);
    
    let csv = 'Client ID,Company Name,Billboard Count\n';
    
    for (const item of report.clientsWithBillboards) {
      csv += `${item.clientId},"${item.companyName}",${item.billboardCount}\n`;
    }
    
    csv += `\nTotal Clients: ${report.totalClients}\n`;
    csv += `Active Clients: ${report.activeClients}`;
    
    return csv;
  }

  /**
   * Get detailed payment report for export
   */
  async getDetailedPaymentReport(startDate?: Date, endDate?: Date, clientId?: string): Promise<Payment[]> {
    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.client', 'client')
      .leftJoinAndSelect('payment.billboard', 'billboard')
      .orderBy('payment.paymentDate', 'DESC');

    if (clientId) {
      query.andWhere('payment.clientId = :clientId', { clientId });
    }

    if (startDate) {
      query.andWhere('payment.paymentDate >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('payment.paymentDate <= :endDate', { endDate });
    }

    return query.getMany();
  }

  /**
   * Generate detailed payments CSV
   */
  async generateDetailedPaymentsCSV(startDate?: Date, endDate?: Date, clientId?: string): Promise<string> {
    const payments = await this.getDetailedPaymentReport(startDate, endDate, clientId);
    
    let csv = 'Payment Date,Client,Billboard Code,Amount,Status,Method,Reference Number,Validated By,Validated At\n';
    
    for (const payment of payments) {
      const date = payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : 'N/A';
      const validatedAt = payment.validatedAt ? new Date(payment.validatedAt).toISOString().split('T')[0] : 'N/A';
      
      csv += `${date},"${payment.client?.companyName || 'N/A'}",${payment.billboard?.code || 'N/A'},${payment.amount},${payment.status},${payment.method || 'N/A'},${payment.referenceNumber || 'N/A'},${payment.validatedBy || 'N/A'},${validatedAt}\n`;
    }
    
    const total = payments.filter(p => p.status === PaymentStatus.VALIDATED).reduce((sum, p) => sum + Number(p.amount), 0);
    csv += `\nTotal Validated Payments: ${total} MT\n`;
    csv += `Total Records: ${payments.length}`;
    
    return csv;
  }
}

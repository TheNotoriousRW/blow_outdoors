import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Billboard } from '../billboards/billboard.entity';
import { Payment } from '../payments/payment.entity';
import { Invoice } from '../invoices/invoice.entity';
import { Notification } from '../notifications/notification.entity';
import { Client } from '../clients/client.entity';
import { PaymentStatus, BillboardStatus } from '../../common/enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Billboard)
    private readonly billboardRepository: Repository<Billboard>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async getClientDashboard(userId: string) {
    // Find client by userId
    const client = await this.clientRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!client) {
      return {
        billboards: {
          total: 0,
          active: 0,
          suspended: 0,
          inDebt: 0,
        },
        payments: {
          pending: 0,
          validated: 0,
          rejected: 0,
          totalPending: 0,
        },
        invoices: {
          total: 0,
          unpaid: 0,
        },
        notifications: {
          unread: 0,
          recent: [],
        },
      };
    }

    // Get billboard statistics
    const billboards = await this.billboardRepository.find({
      where: { client: { id: client.id } },
    });

    const billboardStats = {
      total: billboards.length,
      active: billboards.filter(b => b.status === BillboardStatus.ACTIVE).length,
      suspended: billboards.filter(b => b.status === BillboardStatus.SUSPENDED).length,
      inDebt: billboards.filter(b => b.status === BillboardStatus.IN_DEBT).length,
    };

    // Get payment statistics
    const payments = await this.paymentRepository.find({
      where: { client: { id: client.id } },
    });

    const pendingPayments = payments.filter(p => p.status === PaymentStatus.PENDING);
    const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const paymentStats = {
      pending: pendingPayments.length,
      validated: payments.filter(p => p.status === PaymentStatus.VALIDATED).length,
      rejected: payments.filter(p => p.status === PaymentStatus.REJECTED).length,
      totalPending: totalPendingAmount,
    };

    // Get invoice statistics
    const invoices = await this.invoiceRepository.find({
      where: { payment: { client: { id: client.id } } },
      relations: ['payment'],
    });

    const invoiceStats = {
      total: invoices.length,
      unpaid: invoices.filter(i => {
        return i.payment && i.payment.status !== PaymentStatus.VALIDATED;
      }).length,
    };

    // Get notifications
    const notifications = await this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const notificationStats = {
      unread: notifications.filter(n => !n.isRead).length,
      recent: notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
    };

    return {
      billboards: billboardStats,
      payments: paymentStats,
      invoices: invoiceStats,
      notifications: notificationStats,
    };
  }

  async getAdminDashboard() {
    // Get billboard statistics
    const billboards = await this.billboardRepository.find();
    const billboardStats = {
      total: billboards.length,
      active: billboards.filter(b => b.status === BillboardStatus.ACTIVE).length,
      suspended: billboards.filter(b => b.status === BillboardStatus.SUSPENDED).length,
      inDebt: billboards.filter(b => b.status === BillboardStatus.IN_DEBT).length,
    };

    // Get payment statistics
    const payments = await this.paymentRepository.find();
    const pendingPayments = payments.filter(p => p.status === PaymentStatus.PENDING);
    const totalRevenue = payments
      .filter(p => p.status === PaymentStatus.VALIDATED)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const paymentStats = {
      pending: pendingPayments.length,
      validated: payments.filter(p => p.status === PaymentStatus.VALIDATED).length,
      rejected: payments.filter(p => p.status === PaymentStatus.REJECTED).length,
      totalRevenue,
    };

    // Get client statistics
    const clients = await this.clientRepository.find({
      relations: ['billboards'],
    });

    const clientStats = {
      total: clients.length,
      withBillboards: clients.filter(c => c.billboards && c.billboards.length > 0).length,
    };

    // Get invoice statistics
    const invoices = await this.invoiceRepository.find({
      relations: ['payment'],
    });
    const invoiceStats = {
      total: invoices.length,
      unpaid: invoices.filter(i => {
        return i.payment && i.payment.status !== PaymentStatus.VALIDATED;
      }).length,
    };

    return {
      billboards: billboardStats,
      payments: paymentStats,
      clients: clientStats,
      invoices: invoiceStats,
    };
  }
}

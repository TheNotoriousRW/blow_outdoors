import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { Notification } from './notification.entity';
import { NotificationType } from '../../common/enums';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectQueue('notifications')
    private readonly notificationQueue: Queue,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
    sendEmail: boolean = false,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      user: { id: userId },
      type,
      title,
      message,
      data,
    });

    await this.notificationRepository.save(notification);

    // Queue email notification if requested
    if (sendEmail) {
      await this.notificationQueue.add('send-email', {
        notificationId: notification.id,
        userId,
        title,
        message,
      });
    }

    return notification;
  }

  async findByUser(userId: string, onlyUnread: boolean = false): Promise<Notification[]> {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    if (onlyUnread) {
      query.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    return query.getMany();
  }

  async markAsRead(id: string): Promise<Notification> {
    await this.notificationRepository.update(id, {
      isRead: true,
      readAt: new Date(),
    });

    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new Error('Notification not found');
    }
    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async delete(id: string): Promise<void> {
    await this.notificationRepository.delete(id);
  }
}

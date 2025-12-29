import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
// import * as nodemailer from 'nodemailer'; // Email sending would be implemented here

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  @Process('send-email')
  async handleSendEmail(job: Job) {
    const { notificationId, userId, title, message } = job.data;

    try {
      // TODO: Implement actual email sending with nodemailer
      this.logger.log(`Sending email notification to user ${userId}: ${title}`);

      // Simulate email sending
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update notification status
      await this.notificationRepository.update(notificationId, {
        isEmailSent: true,
        emailSentAt: new Date(),
      });

      this.logger.log(`Email sent successfully for notification ${notificationId}`);
    } catch (error) {
      this.logger.error(`Failed to send email for notification ${notificationId}`, error.stack);
      throw error;
    }
  }
}

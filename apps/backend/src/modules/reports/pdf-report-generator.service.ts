import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PdfReportGeneratorService {
  private readonly logger = new Logger(PdfReportGeneratorService.name);
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = join(process.cwd(), 'uploads', 'reports');
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Generate Revenue Report PDF
   */
  async generateRevenuePDF(reportData: any, startDate?: Date, endDate?: Date): Promise<string> {
    const filename = `revenue-report-${Date.now()}.pdf`;
    const filepath = join(this.uploadDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('Revenue Report', { align: 'center' });
      doc.moveDown();
      
      // Period
      if (startDate || endDate) {
        doc.fontSize(12).text(
          `Period: ${startDate ? startDate.toISOString().split('T')[0] : 'N/A'} to ${endDate ? endDate.toISOString().split('T')[0] : 'N/A'}`,
          { align: 'center' }
        );
        doc.moveDown();
      }

      // Summary
      doc.fontSize(14).text('Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Total Revenue: ${reportData.totalRevenue.toFixed(2)} MT`);
      doc.moveDown();

      // By Status Table
      doc.fontSize(14).text('Revenue by Status', { underline: true });
      doc.moveDown(0.5);

      // Table headers
      const tableTop = doc.y;
      doc.fontSize(10);
      doc.text('Status', 50, tableTop, { width: 150 });
      doc.text('Total Revenue', 200, tableTop, { width: 150 });
      doc.text('Total Payments', 350, tableTop, { width: 150 });

      // Table data
      let currentY = tableTop + 20;
      for (const item of reportData.byStatus) {
        doc.text(item.status, 50, currentY, { width: 150 });
        doc.text(`${parseFloat(item.totalRevenue || 0).toFixed(2)} MT`, 200, currentY, { width: 150 });
        doc.text(item.totalPayments, 350, currentY, { width: 150 });
        currentY += 20;
      }

      // Footer
      doc.fontSize(8).text(
        `Generated on: ${new Date().toISOString()}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      doc.end();

      stream.on('finish', () => {
        this.logger.log(`Revenue PDF generated: ${filename}`);
        resolve(filename);
      });

      stream.on('error', reject);
    });
  }

  /**
   * Generate Billboards in Debt PDF
   */
  async generateBillboardsInDebtPDF(reportData: any): Promise<string> {
    const filename = `billboards-in-debt-${Date.now()}.pdf`;
    const filepath = join(this.uploadDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('Billboards in Debt Report', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(14).text(`Total: ${reportData.total} billboards`);
      doc.moveDown();

      // Table
      doc.fontSize(10);
      const tableTop = doc.y;
      doc.text('Code', 50, tableTop, { width: 80 });
      doc.text('Type', 130, tableTop, { width: 80 });
      doc.text('District', 210, tableTop, { width: 100 });
      doc.text('Client', 310, tableTop, { width: 150 });

      let currentY = tableTop + 20;
      for (const billboard of reportData.billboards) {
        if (currentY > doc.page.height - 100) {
          doc.addPage();
          currentY = 50;
        }

        doc.text(billboard.code, 50, currentY, { width: 80 });
        doc.text(billboard.type, 130, currentY, { width: 80 });
        doc.text(billboard.district || 'N/A', 210, currentY, { width: 100 });
        doc.text(billboard.client?.companyName || 'N/A', 310, currentY, { width: 150 });
        currentY += 20;
      }

      // Footer
      doc.fontSize(8).text(
        `Generated on: ${new Date().toISOString()}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      doc.end();

      stream.on('finish', () => {
        this.logger.log(`Billboards in Debt PDF generated: ${filename}`);
        resolve(filename);
      });

      stream.on('error', reject);
    });
  }

  /**
   * Generate Detailed Payments PDF
   */
  async generateDetailedPaymentsPDF(payments: any[], startDate?: Date, endDate?: Date): Promise<string> {
    const filename = `payments-report-${Date.now()}.pdf`;
    const filepath = join(this.uploadDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      const stream = createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('Detailed Payments Report', { align: 'center' });
      doc.moveDown();
      
      // Period
      if (startDate || endDate) {
        doc.fontSize(12).text(
          `Period: ${startDate ? startDate.toISOString().split('T')[0] : 'N/A'} to ${endDate ? endDate.toISOString().split('T')[0] : 'N/A'}`,
          { align: 'center' }
        );
        doc.moveDown();
      }

      // Summary
      const validatedTotal = payments
        .filter(p => p.status === 'validated')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      doc.fontSize(12).text(`Total Records: ${payments.length}`);
      doc.text(`Total Validated: ${validatedTotal.toFixed(2)} MT`);
      doc.moveDown();

      // Table
      doc.fontSize(8);
      const tableTop = doc.y;
      doc.text('Date', 50, tableTop, { width: 70 });
      doc.text('Client', 120, tableTop, { width: 100 });
      doc.text('Billboard', 220, tableTop, { width: 70 });
      doc.text('Amount', 290, tableTop, { width: 60 });
      doc.text('Status', 350, tableTop, { width: 60 });
      doc.text('Method', 410, tableTop, { width: 60 });
      doc.text('Reference', 470, tableTop, { width: 80 });
      doc.text('Validated', 550, tableTop, { width: 70 });

      let currentY = tableTop + 15;
      for (const payment of payments) {
        if (currentY > doc.page.height - 80) {
          doc.addPage();
          currentY = 50;
        }

        const date = payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : 'N/A';
        const validatedAt = payment.validatedAt ? new Date(payment.validatedAt).toISOString().split('T')[0] : 'N/A';

        doc.text(date, 50, currentY, { width: 70 });
        doc.text(payment.client?.companyName || 'N/A', 120, currentY, { width: 100 });
        doc.text(payment.billboard?.code || 'N/A', 220, currentY, { width: 70 });
        doc.text(`${payment.amount}`, 290, currentY, { width: 60 });
        doc.text(payment.status, 350, currentY, { width: 60 });
        doc.text(payment.method || 'N/A', 410, currentY, { width: 60 });
        doc.text(payment.referenceNumber || 'N/A', 470, currentY, { width: 80 });
        doc.text(validatedAt, 550, currentY, { width: 70 });
        
        currentY += 15;
      }

      // Footer
      doc.fontSize(8).text(
        `Generated on: ${new Date().toISOString()}`,
        50,
        doc.page.height - 30,
        { align: 'center' }
      );

      doc.end();

      stream.on('finish', () => {
        this.logger.log(`Payments PDF generated: ${filename}`);
        resolve(filename);
      });

      stream.on('error', reject);
    });
  }

  /**
   * Get PDF URL
   */
  getPdfUrl(filename: string): string {
    const apiPrefix = this.configService.get('API_PREFIX', 'api');
    const port = this.configService.get('PORT', 3001);
    const host = this.configService.get('HOST', 'localhost');
    
    return `http://${host}:${port}/${apiPrefix}/v1/reports/download/${filename}`;
  }
}

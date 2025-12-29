import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { Invoice } from './invoice.entity';
import { InvoiceType } from '../../common/enums';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

type PDFDoc = typeof PDFDocument;

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);
  private readonly uploadDir = join(process.cwd(), 'uploads', 'invoices');

  constructor() {
    // Criar diretório de uploads se não existir
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Gera PDF de fatura ou recibo
   */
  async generateInvoicePDF(invoice: Invoice): Promise<string> {
    try {
      const fileName = `${invoice.invoiceNumber}.pdf`;
      const filePath = join(this.uploadDir, fileName);

      // Criar documento PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Fatura ${invoice.invoiceNumber}`,
          Author: 'Município de Maputo',
          Subject: 'Fatura de Publicidade',
          Creator: 'Sistema de Gestão de Painéis Publicitários',
        },
      });

      // Stream para arquivo
      const stream = createWriteStream(filePath);
      doc.pipe(stream);

      // Desenhar PDF
      await this.drawInvoiceHeader(doc, invoice);
      this.drawInvoiceInfo(doc, invoice);
      this.drawClientInfo(doc, invoice);
      this.drawLineItems(doc, invoice);
      this.drawTotals(doc, invoice);
      await this.drawQRCode(doc, invoice);
      this.drawFooter(doc, invoice);

      // Finalizar PDF
      doc.end();

      // Aguardar conclusão da escrita
      await new Promise<void>((resolve, reject) => {
        stream.on('finish', () => resolve());
        stream.on('error', reject);
      });

      this.logger.log(`PDF gerado com sucesso: ${fileName}`);
      return filePath;
    } catch (error) {
      this.logger.error(`Erro ao gerar PDF: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cabeçalho com logo e informações do município
   */
  private async drawInvoiceHeader(doc: PDFDoc, invoice: Invoice) {
    // Título do documento
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#1a5490')
      .text('MUNICÍPIO DE MAPUTO', 50, 50, { align: 'center' });

    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#333333')
      .text('Conselho Municipal de Maputo', 50, 80, { align: 'center' });

    doc
      .fontSize(10)
      .text('Av. Julius Nyerere, 1234 - Maputo, Moçambique', 50, 95, {
        align: 'center',
      });

    doc.text('Tel: +258 21 123 456 | Email: gestao@cmaputo.gov.mz', 50, 110, {
      align: 'center',
    });

    // Linha separadora
    doc
      .moveTo(50, 130)
      .lineTo(545, 130)
      .strokeColor('#1a5490')
      .lineWidth(2)
      .stroke();

    // Tipo de documento
    const docType =
      invoice.type === InvoiceType.INVOICE ? 'FATURA' : 'RECIBO DE PAGAMENTO';
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#1a5490')
      .text(docType, 50, 145, { align: 'center' });

    doc.moveDown(2);
  }

  /**
   * Informações da fatura/recibo
   */
  private drawInvoiceInfo(doc: PDFDoc, invoice: Invoice) {
    const startY = 190;

    // Coluna esquerda
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('Número:', 50, startY);

    doc
      .font('Helvetica')
      .text(invoice.invoiceNumber, 120, startY);

    doc
      .font('Helvetica-Bold')
      .text('Data de Emissão:', 50, startY + 15);

    doc
      .font('Helvetica')
      .text(this.formatDate(invoice.issueDate), 120, startY + 15);

    if (invoice.dueDate) {
      doc
        .font('Helvetica-Bold')
        .text('Data de Vencimento:', 50, startY + 30);

      doc
        .font('Helvetica')
        .fillColor(this.isOverdue(invoice.dueDate) ? '#e74c3c' : '#333333')
        .text(this.formatDate(invoice.dueDate), 120, startY + 30);
    }

    // Coluna direita
    if (invoice.payment) {
      doc
        .font('Helvetica-Bold')
        .fillColor('#333333')
        .text('Referência de Pagamento:', 320, startY);

      doc
        .font('Helvetica')
        .text(invoice.payment.referenceNumber, 450, startY);

      doc
        .font('Helvetica-Bold')
        .text('Status:', 320, startY + 15);

      const statusColor = this.getStatusColor(invoice.payment.status);
      const statusText = this.getStatusText(invoice.payment.status);

      doc
        .font('Helvetica-Bold')
        .fillColor(statusColor)
        .text(statusText, 450, startY + 15);
    }

    doc.moveDown(3);
  }

  /**
   * Informações do cliente
   */
  private drawClientInfo(doc: PDFDoc, invoice: Invoice) {
    const startY = doc.y + 10;

    // Box do cliente
    doc
      .rect(50, startY, 495, 80)
      .fillColor('#f8f9fa')
      .fill()
      .strokeColor('#dee2e6')
      .stroke();

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#1a5490')
      .text('CLIENTE', 60, startY + 10);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('Empresa:', 60, startY + 30);

    doc
      .font('Helvetica')
      .text(invoice.client?.companyName || 'N/A', 120, startY + 30);

    if (invoice.client?.taxId) {
      doc
        .font('Helvetica-Bold')
        .text('NUIT:', 60, startY + 45);

      doc
        .font('Helvetica')
        .text(invoice.client.taxId, 120, startY + 45);
    }

    doc
      .font('Helvetica-Bold')
      .text('Email:', 60, startY + 60);

    doc
      .font('Helvetica')
      .text(invoice.client?.user?.email || 'N/A', 120, startY + 60);

    doc
      .font('Helvetica-Bold')
      .text('Telefone:', 320, startY + 60);

    doc
      .font('Helvetica')
      .text(invoice.client?.user?.phone || 'N/A', 380, startY + 60);

    doc.moveDown(3);
  }

  /**
   * Itens da fatura
   */
  private drawLineItems(doc: PDFDoc, invoice: Invoice) {
    const startY = doc.y + 20;

    // Cabeçalho da tabela
    doc
      .rect(50, startY, 495, 25)
      .fillColor('#1a5490')
      .fill();

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .text('DESCRIÇÃO', 60, startY + 8, { width: 280 });

    doc.text('QTD', 350, startY + 8, { width: 40, align: 'center' });
    doc.text('PREÇO UNIT.', 400, startY + 8, { width: 60, align: 'right' });
    doc.text('TOTAL', 470, startY + 8, { width: 65, align: 'right' });

    let currentY = startY + 25;

    // Sistema agora usa upload manual - lineItems não existe mais
    // Manter apenas para compatibilidade se algum invoice antigo tiver
    const lineItems = (invoice as any).lineItems || [];
    lineItems.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';

      doc
        .rect(50, currentY, 495, 25)
        .fillColor(bgColor)
        .fill()
        .strokeColor('#dee2e6')
        .stroke();

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#333333')
        .text(item.description, 60, currentY + 8, { width: 280 });

      doc.text(item.quantity.toString(), 350, currentY + 8, {
        width: 40,
        align: 'center',
      });

      doc.text(this.formatCurrency(item.unitPrice), 400, currentY + 8, {
        width: 60,
        align: 'right',
      });

      doc.text(this.formatCurrency(item.total), 470, currentY + 8, {
        width: 65,
        align: 'right',
      });

      currentY += 25;
    });

    doc.y = currentY;
    doc.moveDown(1);
  }

  /**
   * Totais (subtotal, IVA, total)
   */
  private drawTotals(doc: PDFDoc, invoice: Invoice) {
    const startY = doc.y + 10;
    const rightColumnX = 400;

    // Subtotal
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#333333')
      .text('Subtotal:', rightColumnX, startY, { align: 'right', width: 80 });

    doc.text(this.formatCurrency(invoice.amount), rightColumnX + 90, startY, {
      align: 'right',
      width: 55,
    });

    // IVA
    doc.text('IVA (16%):', rightColumnX, startY + 15, {
      align: 'right',
      width: 80,
    });

    doc.text(this.formatCurrency(invoice.tax), rightColumnX + 90, startY + 15, {
      align: 'right',
      width: 55,
    });

    // Linha separadora
    doc
      .moveTo(rightColumnX, startY + 35)
      .lineTo(545, startY + 35)
      .strokeColor('#1a5490')
      .lineWidth(1)
      .stroke();

    // Total
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#1a5490')
      .text('TOTAL:', rightColumnX, startY + 45, { align: 'right', width: 80 });

    doc
      .fontSize(14)
      .text(this.formatCurrency(invoice.totalAmount), rightColumnX + 90, startY + 45, {
        align: 'right',
        width: 55,
      });

    doc.moveDown(3);
  }

  /**
   * QR Code para pagamento ou validação
   */
  private async drawQRCode(doc: PDFDoc, invoice: Invoice) {
    const qrData = JSON.stringify({
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.totalAmount,
      reference: invoice.payment?.referenceNumber || invoice.invoiceNumber,
      issueDate: invoice.issueDate,
    });

    // Gerar QR Code como data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 150,
      margin: 1,
    });

    // Converter data URL para buffer
    const qrBuffer = Buffer.from(
      qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, ''),
      'base64',
    );

    const startY = doc.y + 20;

    // Box do QR Code
    doc
      .rect(50, startY, 200, 160)
      .strokeColor('#dee2e6')
      .stroke();

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#1a5490')
      .text('CÓDIGO DE VALIDAÇÃO', 60, startY + 10);

    // Inserir QR Code
    doc.image(qrBuffer, 75, startY + 30, { width: 150 });

    // Informações de pagamento
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#333333')
      .text('Banco: BCI', 270, startY + 20);

    doc.text('NIB: 0001 0000 12345678901 43', 270, startY + 35);
    doc.text('Conta: 123456789', 270, startY + 50);
    doc.text(`Referência: ${invoice.invoiceNumber}`, 270, startY + 65);

    if (invoice.description) {
      doc
        .fontSize(8)
        .font('Helvetica-Oblique')
        .text(invoice.description, 270, startY + 90, { width: 270 });
    }

    doc.y = startY + 180;
    doc.moveDown(2);
  }

  /**
   * Rodapé do documento
   */
  private drawFooter(doc: PDFDoc, invoice: Invoice) {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 100;

    // Linha separadora
    doc
      .moveTo(50, footerY)
      .lineTo(545, footerY)
      .strokeColor('#dee2e6')
      .lineWidth(1)
      .stroke();

    // Texto do rodapé
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        'Este documento foi gerado eletronicamente e é válido sem assinatura.',
        50,
        footerY + 10,
        { align: 'center' },
      );

    doc.text(
      'Para verificar a autenticidade, escaneie o QR Code acima.',
      50,
      footerY + 25,
      { align: 'center' },
    );

    doc
      .fontSize(7)
      .font('Helvetica-Oblique')
      .text(
        `Documento gerado em ${this.formatDate(new Date())} às ${this.formatTime(new Date())}`,
        50,
        footerY + 45,
        { align: 'center' },
      );

    doc
      .fontSize(7)
      .text(
        'Sistema de Gestão de Painéis Publicitários v2.0 | © 2025 Município de Maputo',
        50,
        footerY + 60,
        { align: 'center' },
      );
  }

  /**
   * Helpers
   */
  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('pt-MZ', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatCurrency(value: number): string {
    return `${value.toFixed(2)} MT`;
  }

  private isOverdue(dueDate: Date): boolean {
    return new Date(dueDate) < new Date();
  }

  private getStatusColor(status: string): string {
    const colors = {
      pending: '#f39c12',
      validated: '#27ae60',
      rejected: '#e74c3c',
    };
    return colors[status] || '#333333';
  }

  private getStatusText(status: string): string {
    const texts = {
      pending: 'PENDENTE',
      validated: 'VALIDADO',
      rejected: 'REJEITADO',
    };
    return texts[status] || status.toUpperCase();
  }

  /**
   * Obter URL pública do PDF
   */
  getPdfUrl(invoiceNumber: string): string {
    return `${process.env.BASE_URL || 'http://localhost:3001'}/api/v1/invoices/download/${invoiceNumber}.pdf`;
  }
}

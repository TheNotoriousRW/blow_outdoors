import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { ReportsService } from './reports.service';
import { PdfReportGeneratorService } from './pdf-report-generator.service';
import { ClientsService } from '../clients/clients.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly pdfReportGeneratorService: PdfReportGeneratorService,
    private readonly clientsService: ClientsService,
  ) {}

  @Get('revenue')
  @Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Get revenue report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Revenue report generated' })
  async getRevenue(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string, @Req() req?: any) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    // If user is CLIENT, get their clientId
    let clientId: string | undefined;
    if (req?.user?.role === UserRole.CLIENT) {
      const client = await this.clientsService.findByUserId(req.user.sub);
      clientId = client?.id;
    }
    
    return this.reportsService.getRevenueReport(start, end, clientId);
  }

  @Get('billboards-in-debt')
  @Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Get billboards in debt' })
  @ApiResponse({ status: 200, description: 'Billboards in debt retrieved' })
  async getBillboardsInDebt(@Req() req?: any) {
    let clientId: string | undefined;
    if (req?.user?.role === UserRole.CLIENT) {
      const client = await this.clientsService.findByUserId(req.user.sub);
      clientId = client?.id;
    }
    return this.reportsService.getBillboardsInDebt(clientId);
  }

  @Get('billboards-by-district')
  @Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.TECHNICIAN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Get billboards distribution by district' })
  @ApiResponse({ status: 200, description: 'District statistics retrieved' })
  async getBillboardsByDistrict(@Req() req?: any) {
    let clientId: string | undefined;
    if (req?.user?.role === UserRole.CLIENT) {
      const client = await this.clientsService.findByUserId(req.user.sub);
      clientId = client?.id;
    }
    return this.reportsService.getBillboardsByDistrict(clientId);
  }

  @Get('client-statistics')
  @Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Get client statistics' })
  @ApiResponse({ status: 200, description: 'Client statistics retrieved' })
  async getClientStatistics(@Req() req?: any) {
    let clientId: string | undefined;
    if (req?.user?.role === UserRole.CLIENT) {
      const client = await this.clientsService.findByUserId(req.user.sub);
      clientId = client?.id;
    }
    return this.reportsService.getClientStatistics(clientId);
  }

  // ========== EXPORT ENDPOINTS ==========

  @Get('revenue/export/csv')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Export revenue report as CSV' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'CSV file generated' })
  async exportRevenueCSV(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const csv = await this.reportsService.generateRevenueCSV(start, end);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="revenue-report-${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get('billboards-in-debt/export/csv')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Export billboards in debt as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file generated' })
  async exportBillboardsInDebtCSV(@Res() res?: Response) {
    const csv = await this.reportsService.generateBillboardsInDebtCSV();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="billboards-in-debt-${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get('billboards-by-district/export/csv')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Export billboards by district as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file generated' })
  async exportBillboardsByDistrictCSV(@Res() res?: Response) {
    const csv = await this.reportsService.generateBillboardsByDistrictCSV();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="billboards-by-district-${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get('client-statistics/export/csv')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Export client statistics as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file generated' })
  async exportClientStatisticsCSV(@Res() res?: Response) {
    const csv = await this.reportsService.generateClientStatisticsCSV();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="client-statistics-${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get('payments/export/csv')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Export detailed payments report as CSV' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'CSV file generated' })
  async exportPaymentsCSV(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const csv = await this.reportsService.generateDetailedPaymentsCSV(start, end);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payments-report-${Date.now()}.csv"`);
    res.send(csv);
  }

  // ========== PDF EXPORT ENDPOINTS ==========

  @Get('revenue/export/pdf')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Export revenue report as PDF' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'PDF file generated' })
  async exportRevenuePDF(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const reportData = await this.reportsService.getRevenueReport(start, end);
    const filename = await this.pdfReportGeneratorService.generateRevenuePDF(reportData, start, end);
    
    const filepath = join(process.cwd(), 'uploads', 'reports', filename);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = createReadStream(filepath);
    fileStream.pipe(res);
  }

  @Get('billboards-in-debt/export/pdf')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Export billboards in debt as PDF' })
  @ApiResponse({ status: 200, description: 'PDF file generated' })
  async exportBillboardsInDebtPDF(@Res() res?: Response) {
    const reportData = await this.reportsService.getBillboardsInDebt();
    const filename = await this.pdfReportGeneratorService.generateBillboardsInDebtPDF(reportData);
    
    const filepath = join(process.cwd(), 'uploads', 'reports', filename);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = createReadStream(filepath);
    fileStream.pipe(res);
  }

  @Get('payments/export/pdf')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Export detailed payments report as PDF' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'PDF file generated' })
  async exportPaymentsPDF(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const payments = await this.reportsService.getDetailedPaymentReport(start, end);
    const filename = await this.pdfReportGeneratorService.generateDetailedPaymentsPDF(payments, start, end);
    
    const filepath = join(process.cwd(), 'uploads', 'reports', filename);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = createReadStream(filepath);
    fileStream.pipe(res);
  }

  @Get('download/:filename')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Download generated report file' })
  @ApiResponse({ status: 200, description: 'File downloaded' })
  async downloadReport(@Req() req: any, @Res() res: Response) {
    const filename = req.params.filename;
    const filepath = join(process.cwd(), 'uploads', 'reports', filename);

    if (!existsSync(filepath)) {
      res.status(404).send({ message: 'File not found' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = createReadStream(filepath);
    fileStream.pipe(res);
  }
}

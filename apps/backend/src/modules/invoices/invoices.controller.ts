import { Controller, Get, Post, Patch, Delete, Body, Param, Req, Res, NotFoundException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { InvoicesService } from './invoices.service';
import { ClientsService } from '../clients/clients.service';
import { BillboardsService } from '../billboards/billboards.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

@ApiTags('Invoices')
@ApiBearerAuth('JWT-auth')
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly clientsService: ClientsService,
    private readonly billboardsService: BillboardsService,
  ) {}

  @Get()
  async findAll(@Req() req?: any) {
    // If user is CLIENT, filter by their clientId
    if (req?.user?.role === UserRole.CLIENT) {
      const client = await this.clientsService.findByUserId(req.user.sub);
      return this.invoicesService.findByClient(client?.id);
    }
    
    return this.invoicesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req?: any) {
    // Handle download route
    if (id === 'download') {
      return; // Will be handled by specialized method below
    }

    const invoice = await this.invoicesService.findOne(id);
    
    // If user is CLIENT, verify ownership
    if (req?.user?.role === UserRole.CLIENT) {
      const client = await this.clientsService.findByUserId(req.user.sub);
      if (invoice.payment?.client?.id !== client?.id) {
        throw new Error('Forbidden: You can only access your own invoices');
      }
    }
    
    return invoice;
  }

  @Get('download/:filename')
  async downloadPdf(@Param('filename') filename: string, @Res() res: Response, @Req() req?: any) {
    // Extrair invoice number do filename (remove .pdf)
    const invoiceNumber = filename.replace('.pdf', '');
    
    // Verificar se a fatura existe
    const invoice = await this.invoicesService.findByNumber(invoiceNumber);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Se for CLIENT, verificar propriedade
    if (req?.user?.role === UserRole.CLIENT) {
      const client = await this.clientsService.findByUserId(req.user.sub);
      if (invoice.payment?.client?.id !== client?.id) {
        throw new NotFoundException('Forbidden: You can only access your own invoices');
      }
    }

    // Caminho do arquivo PDF
    const uploadDir = join(process.cwd(), 'uploads', 'invoices');
    const filePath = join(uploadDir, filename);

    // Verificar se o arquivo existe
    if (!existsSync(filePath)) {
      throw new NotFoundException('PDF file not found');
    }

    // Configurar headers para download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream do arquivo
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Get('calculate/:billboardId')
  @ApiOperation({ summary: 'Calculate invoice values for a billboard' })
  async calculateInvoiceForBillboard(@Param('billboardId') billboardId: string) {
    const billboard = await this.billboardsService.findOne(billboardId);
    
    if (!billboard) {
      throw new NotFoundException('Billboard not found');
    }

    const amount = Number(billboard.annualFee);
    const tax = amount * 0.16; // 16% IVA
    const totalAmount = amount + tax;

    return {
      data: {
        billboardId: billboard.id,
        billboardCode: billboard.code,
        billboardName: billboard.name,
        clientId: billboard.clientId,
        clientName: billboard.client?.companyName,
        area: billboard.area,
        annualFee: billboard.annualFee,
        calculations: {
          amount: amount.toFixed(2),
          tax: tax.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          taxRate: '16%',
        },
        suggestedDescription: `Taxa anual de publicidade - Painel ${billboard.code} (${billboard.address})`,
        tariffZone: billboard.tariffZone?.name,
      },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Create invoice with file upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Invoice PDF or image file',
        },
        invoiceNumber: { type: 'string' },
        clientId: { type: 'string' },
        amount: { type: 'number' },
        tax: { type: 'number' },
        totalAmount: { type: 'number' },
        issueDate: { type: 'string', format: 'date' },
        dueDate: { type: 'string', format: 'date' },
        type: { type: 'string', enum: ['invoice', 'receipt', 'proforma', 'final_invoice'] },
        description: { type: 'string' },
        notes: { type: 'string' },
        paymentId: { type: 'string' },
        billboardId: { type: 'string' },
      },
      required: ['invoiceNumber', 'clientId', 'amount', 'totalAmount', 'issueDate'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/invoices',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|jpg|jpeg|png)$/)) {
          return cb(new Error('Only PDF and image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async create(
    @Body() data: any,
    @UploadedFile() file: Express.Multer.File,
    @Req() req?: any,
  ) {
    console.log('===== CREATE INVOICE DEBUG =====');
    console.log('Raw data:', data);
    console.log('File:', file ? file.filename : 'no file');
    console.log('User:', req?.user?.sub);
    
    // Converter campos numéricos (vêm como string do form-data)
    const invoiceData = {
      invoiceNumber: data.invoiceNumber,
      clientId: data.clientId,
      amount: Number(data.amount),
      tax: data.tax ? Number(data.tax) : 0,
      totalAmount: Number(data.totalAmount),
      issueDate: data.issueDate,
      dueDate: data.dueDate || null,
      type: data.type || 'invoice',
      description: data.description || null,
      notes: data.notes || null,
      paymentId: data.paymentId || null,
      billboardId: data.billboardId || null,
      fileUrl: file ? `/uploads/invoices/${file.filename}` : null,
      fileName: file ? file.originalname : null,
      issuedBy: req?.user?.sub,
    };
    
    console.log('Processed invoiceData:', invoiceData);
    
    return this.invoicesService.create(invoiceData);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Update invoice with optional file upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Invoice PDF or image file',
        },
        invoiceNumber: { type: 'string' },
        amount: { type: 'number' },
        tax: { type: 'number' },
        totalAmount: { type: 'number' },
        issueDate: { type: 'string', format: 'date' },
        dueDate: { type: 'string', format: 'date' },
        type: { type: 'string', enum: ['invoice', 'receipt', 'proforma', 'final_invoice'] },
        description: { type: 'string' },
        notes: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/invoices',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|jpg|jpeg|png)$/)) {
          return cb(new Error('Only PDF and image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const updateData: any = { ...data };
    
    if (file) {
      updateData.fileUrl = `/uploads/invoices/${file.filename}`;
      updateData.fileName = file.originalname;
    }
    
    return this.invoicesService.update(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Delete invoice' })
  async remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }
}

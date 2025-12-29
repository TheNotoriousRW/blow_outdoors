import { Controller, Get, Post, Patch, Body, Param, Query, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PaymentsService } from './payments.service';
import { DebtCalculationService } from './debt-calculation.service';
import { ClientsService } from '../clients/clients.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, PaymentStatus } from '../../common/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly debtCalculationService: DebtCalculationService,
    private readonly clientsService: ClientsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  async findAll(
    @Query('clientId') queryClientId?: string,
    @Query('status') status?: PaymentStatus,
    @Req() req?: any,
  ) {
    // If user is CLIENT, force filter by their clientId
    let clientId = queryClientId;
    if (req?.user?.role === UserRole.CLIENT) {
      const client = await this.clientsService.findByUserId(req.user.sub);
      clientId = client?.id;
    }
    
    return this.paymentsService.findAll({ clientId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  async findOne(@Param('id') id: string, @Req() req?: any) {
    const payment = await this.paymentsService.findOne(id);
    
    // If user is CLIENT, verify ownership
    if (req?.user?.role === UserRole.CLIENT) {
      const client = await this.clientsService.findByUserId(req.user.sub);
      if (payment.client?.id !== client?.id) {
        throw new Error('Forbidden: You can only access your own payments');
      }
    }
    
    return payment;
  }

  @Post()
  @ApiOperation({ summary: 'Create new payment with optional proof document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string', format: 'uuid', description: 'Invoice ID to link payment' },
        billboardId: { type: 'string', format: 'uuid', description: 'Billboard ID (if not linked to invoice)' },
        amount: { type: 'number', description: 'Payment amount' },
        paymentMethod: { type: 'string', enum: ['cash', 'bank_transfer', 'mpesa', 'emola', 'credit_card'], description: 'Payment method' },
        paymentDate: { type: 'string', format: 'date', description: 'Payment date (YYYY-MM-DD)' },
        notes: { type: 'string', description: 'Additional notes' },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Payment proof document (PDF, JPG, PNG) - Optional',
        },
      },
      required: ['amount', 'paymentMethod', 'paymentDate'],
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/payments',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null)
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
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  }))
  async create(@UploadedFile() file?: Express.Multer.File, @Req() req?: any) {
    // Extract data from request body (multipart/form-data)
    const body = req.body;
    console.log('=== PAYMENT REQUEST DEBUG ===');
    console.log('Body:', body);
    console.log('File:', file ? { filename: file.filename, size: file.size } : 'No file');
    console.log('User:', req.user);
    
    const data: any = {
      invoiceId: body.invoiceId,
      billboardId: body.billboardId,
      amount: body.amount ? Number(body.amount) : undefined,
      paymentMethod: body.paymentMethod,
      paymentDate: body.paymentDate,
      notes: body.notes,
    };

    // If user is CLIENT, force their clientId
    if (req?.user?.role === UserRole.CLIENT) {
      const client = await this.clientsService.findByUserId(req.user.sub);
      data.clientId = client?.id;
    }
    
    console.log('Data to service:', data);
    
    // Use createWithProof if file is provided, otherwise use create
    if (file) {
      return this.paymentsService.createWithProof(data, file);
    }
    
    return this.paymentsService.create(data);
  }

  @Post('with-proof')
  @ApiOperation({ summary: 'Create payment with proof document upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', format: 'uuid' },
        billboardId: { type: 'string', format: 'uuid' },
        amount: { type: 'number' },
        method: { type: 'string', enum: ['CASH', 'BANK_TRANSFER', 'MPESA', 'EMOLA', 'CREDIT_CARD'] },
        paymentDate: { type: 'string', format: 'date' },
        notes: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Payment proof document (PDF, JPG, PNG)',
        },
      },
      required: ['clientId', 'billboardId', 'amount', 'method', 'paymentDate'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async createWithProof(@Body() data: any, @UploadedFile() file?: Express.Multer.File, @Req() req?: any) {
    // If user is CLIENT, force their clientId
    if (req?.user?.role === UserRole.CLIENT) {
      const client = await this.clientsService.findByUserId(req.user.sub);
      data.clientId = client?.id;
    }
    
    return this.paymentsService.createWithProof(data, file);
  }

  @Post('submit-with-debt-calculation/:billboardId')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Submit payment with automatic debt calculation (CLIENT only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Payment proof document (PDF, JPG, PNG)',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async submitPaymentWithDebtCalculation(
    @Param('billboardId') billboardId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req?: any,
  ) {
    const client = await this.clientsService.findByUserId(req.user.sub);
    if (!client) {
      throw new Error('Client not found for this user');
    }

    const result = await this.paymentsService.createPaymentWithDebtCalculation(
      billboardId,
      client.id,
      file,
    );

    return {
      message: 'Pagamento submetido com sucesso! Aguardando validação.',
      payment: result.payment,
      debtCalculation: result.debtInfo,
    };
  }

  @Patch(':id/attach-proof')
  @ApiOperation({ summary: 'Attach proof document to existing payment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Payment proof document',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async attachProof(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Req() req?: any) {
    // If user is CLIENT, verify ownership
    if (req?.user?.role === UserRole.CLIENT) {
      const payment = await this.paymentsService.findOne(id);
      const client = await this.clientsService.findByUserId(req.user.sub);
      if (payment.client?.id !== client?.id) {
        throw new Error('Forbidden: You can only attach proofs to your own payments');
      }
    }
    
    return this.paymentsService.attachProof(id, file);
  }

  @Patch(':id/validate')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Validate payment' })
  async validate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.paymentsService.validatePayment(id, user.id);
  }

  @Patch(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Reject payment' })
  async reject(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: User) {
    return this.paymentsService.rejectPayment(id, reason, user.id);
  }

  @Get('calculate-debt/:billboardId')
  @ApiOperation({ summary: 'Calculate debt for a billboard before payment submission' })
  async calculateDebt(@Param('billboardId') billboardId: string, @Req() req?: any) {
    const debtInfo = await this.debtCalculationService.calculateDebt(billboardId);
    
    // If user is CLIENT, verify they own this billboard
    if (req?.user?.role === UserRole.CLIENT) {
      const client = await this.clientsService.findByUserId(req.user.sub);
      // We'll verify ownership in the service if needed, for now return the info
    }
    
    return debtInfo;
  }

  @Get('client-debt-summary/:clientId')
  @ApiOperation({ summary: 'Get total debt summary for a client' })
  async getClientDebtSummary(@Param('clientId') clientId: string, @Req() req?: any) {
    // If user is CLIENT, verify they are accessing their own summary
    if (req?.user?.role === UserRole.CLIENT) {
      const client = await this.clientsService.findByUserId(req.user.sub);
      if (client?.id !== clientId) {
        throw new Error('Forbidden: You can only access your own debt summary');
      }
    }
    
    return this.debtCalculationService.getClientDebtSummary(clientId);
  }

  @Get('my-debt-summary')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Get my debt summary (CLIENT only)' })
  async getMyDebtSummary(@Req() req?: any) {
    const client = await this.clientsService.findByUserId(req.user.sub);
    if (!client) {
      throw new Error('Client not found for this user');
    }
    
    return this.debtCalculationService.getClientDebtSummary(client.id);
  }
}

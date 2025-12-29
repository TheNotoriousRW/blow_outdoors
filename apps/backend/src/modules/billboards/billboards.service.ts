import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Billboard } from './billboard.entity';
import { BillboardStatus, PaymentStatus } from '../../common/enums';
import { ProformaGeneratorService } from '../invoices/proforma-generator.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BillboardsService {
  constructor(
    @InjectRepository(Billboard)
    private readonly billboardRepository: Repository<Billboard>,
    private readonly proformaGeneratorService: ProformaGeneratorService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Calculate area and annual fee for a billboard
   * @param width Width in meters
   * @param height Height in meters
   * @param billboardType Type of billboard
   * @param tariffZoneId Tariff zone ID
   * @returns Object with area and annualFee
   */
  async calculateFees(
    width: number,
    height: number,
    billboardType: string,
    tariffZoneId: string,
  ): Promise<{ area: number; annualFee: number; pricePerSquareMeter: number }> {
    // Calculate area
    const area = width * height;

    // Find applicable tariff
    const tariffRepository = this.billboardRepository.manager.getRepository('Tariff');
    const tariff = await tariffRepository.findOne({
      where: {
        zone: { id: tariffZoneId },
        billboardType: billboardType,
        isActive: true,
      },
    });

    if (!tariff) {
      throw new NotFoundException(
        `No active tariff found for type ${billboardType} in zone ${tariffZoneId}`
      );
    }

    const pricePerSquareMeter = Number(tariff.pricePerSquareMeterPerYear);
    const annualFee = area * pricePerSquareMeter;

    return {
      area,
      annualFee,
      pricePerSquareMeter,
    };
  }

  async findAll(filters?: {
    status?: BillboardStatus;
    clientId?: string;
    district?: string;
    type?: string;
  }): Promise<Billboard[]> {
    const query = this.billboardRepository.createQueryBuilder('billboard')
      .leftJoinAndSelect('billboard.client', 'client')
      .leftJoinAndSelect('billboard.tariffZone', 'tariffZone')
      .where('billboard.isActive = :isActive', { isActive: true });

    if (filters?.status) {
      query.andWhere('billboard.status = :status', { status: filters.status });
    }
    if (filters?.clientId) {
      query.andWhere('billboard.clientId = :clientId', { clientId: filters.clientId });
    }
    if (filters?.district) {
      query.andWhere('billboard.district = :district', { district: filters.district });
    }
    if (filters?.type) {
      query.andWhere('billboard.type = :type', { type: filters.type });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Billboard> {
    const billboard = await this.billboardRepository.findOne({
      where: { id },
      relations: ['client', 'tariffZone', 'payments', 'payments.invoices'],
    });

    if (!billboard) {
      throw new NotFoundException(`Billboard with ID ${id} not found`);
    }

    return billboard;
  }

  async findOneWithDetails(id: string): Promise<any> {
    const billboard = await this.billboardRepository.findOne({
      where: { id },
      relations: ['client', 'client.user', 'tariffZone', 'payments', 'payments.invoices'],
    });

    if (!billboard) {
      throw new NotFoundException(`Billboard with ID ${id} not found`);
    }

    // Get applicable tariff for this billboard
    let currentTariff = null;
    if (billboard.tariffZone) {
      const tariffRepository = this.billboardRepository.manager.getRepository('Tariff');
      currentTariff = await tariffRepository.findOne({
        where: {
          zoneId: billboard.tariffZone.id,
          billboardType: billboard.type,
          isActive: true,
        },
        order: { createdAt: 'DESC' },
      });
    }

    // Calculate payment statistics
    const payments = billboard.payments || [];
    const paymentHistory = payments.map(p => ({
      id: p.id,
      amount: Number(p.amount),
      method: p.method,
      status: p.status,
      referenceNumber: p.referenceNumber,
      paymentDate: p.paymentDate,
      validatedAt: p.validatedAt,
      validatedBy: p.validatedBy,
      createdAt: p.createdAt,
      hasProof: !!p.proofDocument,
    }));

    // Calculate debt
    const annualRate = billboard.annualFee
      ? Number(billboard.annualFee)
      : (currentTariff && billboard.area)
        ? Number(currentTariff.pricePerSquareMeterPerYear) * Number(billboard.area)
        : 0;
    
    const validatedPayments = payments.filter(p => p.status === PaymentStatus.VALIDATED);
    const totalPaid = validatedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    // Calculate years since installation
    const installDate = billboard.installationDate || billboard.createdAt;
    const yearsSinceInstall = Math.max(1, Math.ceil(
      (Date.now() - new Date(installDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
    ));
    
    const totalOwed = annualRate * yearsSinceInstall;
    const currentDebt = Math.max(0, totalOwed - totalPaid);
    const yearsInDebt = annualRate > 0 ? Math.floor(currentDebt / annualRate) : 0;

    // Calculate next payment due date
    let nextPaymentDue = null;
    if (currentDebt > 0) {
      nextPaymentDue = new Date();
      nextPaymentDue.setDate(1); // First day of current month
      if (nextPaymentDue < new Date()) {
        nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);
      }
    }

    // Format location as GeoJSON
    let locationGeoJSON = null;
    if (billboard.location) {
      // billboard.location is already in GeoJSON format from PostGIS
      locationGeoJSON = {
        type: 'Feature',
        geometry: billboard.location,
        properties: {
          address: billboard.address,
          district: billboard.district,
          neighborhood: billboard.neighborhood,
        },
      };
    }

    return {
      // Basic info
      id: billboard.id,
      code: billboard.code,
      name: billboard.name,
      type: billboard.type,
      size: billboard.size,
      status: billboard.status,
      description: billboard.description,
      images: billboard.images || [],
      
      // Dimensions
      width: billboard.width,
      height: billboard.height,
      area: billboard.area,
      annualFee: billboard.annualFee,
      
      // Location
      address: billboard.address,
      street: billboard.street,
      district: billboard.district,
      neighborhood: billboard.neighborhood,
      location: locationGeoJSON,
      
      // Client info
      client: billboard.client ? {
        id: billboard.client.id,
        companyName: billboard.client.companyName,
        email: billboard.client.user?.email,
        phone: billboard.client.user?.phone,
      } : null,
      
      clientId: billboard.clientId,
      
      // Tariff info
      tariffZoneId: billboard.tariffZoneId,
      tariffZone: billboard.tariffZone ? {
        id: billboard.tariffZone.id,
        name: billboard.tariffZone.name,
        districts: billboard.tariffZone.districts,
      } : null,
      currentTariff: currentTariff ? {
        id: currentTariff.id,
        pricePerSquareMeterPerYear: Number(currentTariff.pricePerSquareMeterPerYear),
        validFrom: currentTariff.validFrom,
        validUntil: currentTariff.validUntil,
      } : null,
      
      // Financial info
      financialSummary: {
        annualRate,
        yearsSinceInstall,
        totalOwed,
        totalPaid,
        currentDebt,
        yearsInDebt,
        nextPaymentDue,
      },
      
      // Payment history
      paymentHistory,
      paymentStatistics: {
        total: payments.length,
        validated: validatedPayments.length,
        pending: payments.filter(p => p.status === PaymentStatus.PENDING).length,
        rejected: payments.filter(p => p.status === PaymentStatus.REJECTED).length,
      },
      
      // Dates
      installationDate: billboard.installationDate,
      lastInspectionDate: billboard.lastInspectionDate,
      nextDueDate: billboard.nextDueDate,
      contractExpiryDate: billboard.contractExpiryDate,
      createdAt: billboard.createdAt,
      updatedAt: billboard.updatedAt,
    };
  }

  async create(createBillboardDto: any, userId?: string): Promise<Billboard> {
    // Calculate fees if tariff zone is provided
    if (createBillboardDto.tariffZoneId) {
      let area = createBillboardDto.area;
      
      // Calculate area from dimensions if provided
      if (createBillboardDto.width && createBillboardDto.height) {
        area = createBillboardDto.width * createBillboardDto.height;
        createBillboardDto.area = area;
      }
      
      // Calculate annual fee if we have area and tariff zone
      if (area && createBillboardDto.tariffZoneId) {
        const billboardType = createBillboardDto.type || 'billboard';
        
        // Find applicable tariff
        const tariffRepository = this.billboardRepository.manager.getRepository('Tariff');
        const tariff = await tariffRepository.findOne({
          where: {
            zoneId: createBillboardDto.tariffZoneId,
            billboardType: billboardType,
            isActive: true,
          },
          order: {
            validFrom: 'DESC',
          },
        });

        if (tariff) {
          const pricePerSquareMeter = Number(tariff['pricePerSquareMeterPerYear']);
          createBillboardDto.annualFee = area * pricePerSquareMeter;
        }
      }
    }
    
    const billboard = this.billboardRepository.create(createBillboardDto);
    const savedBillboard = await this.billboardRepository.save(billboard) as unknown as Billboard;
    
    // Reload billboard with relations to get full client and tariffZone data
    const fullBillboard = await this.billboardRepository.findOne({
      where: { id: savedBillboard.id },
      relations: ['client', 'client.user', 'tariffZone'],
    });
    
    // Audit log
    if (userId) {
      await this.auditService.log(
        userId,
        'CREATE_BILLBOARD',
        'Billboard',
        savedBillboard.id,
        null,
        {
          code: savedBillboard.code,
          type: savedBillboard.type,
          size: savedBillboard.size,
          clientId: fullBillboard?.client?.id,
        },
      );
    }
    
    // Geração automática de Pro Forma DESATIVADA
    // O admin deve criar faturas manualmente via upload
    // if (fullBillboard?.client && fullBillboard?.tariffZone) {
    //   try {
    //     await this.proformaGeneratorService.generateProformaForNewBillboard(savedBillboard.id);
    //   } catch (error) {
    //     console.error(`Error generating proforma for billboard ${savedBillboard.id}:`, error);
    //   }
    // }
    
    return fullBillboard || savedBillboard;
  }

  async update(id: string, updateBillboardDto: any): Promise<Billboard> {
    // Create a clean update object
    const updateData: any = { ...updateBillboardDto };
    
    // Handle tariffZoneId if provided - convert to direct column update
    if (updateData.tariffZoneId) {
      // Keep it as is - tariffZoneId is now a column in the entity
    }
    
    // Handle clientId if provided
    if (updateData.clientId) {
      // Keep it as is - clientId is now a column in the entity
    }
    
    // Remove relation objects if exist (cannot update relations directly)
    if (updateData.tariffZone) {
      delete updateData.tariffZone;
    }
    if (updateData.client) {
      delete updateData.client;
    }
    
    await this.billboardRepository.update(id, updateData);
    return this.findOne(id);
  }

  async updateStatus(id: string, status: BillboardStatus): Promise<Billboard> {
    await this.billboardRepository.update(id, { status });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const billboard = await this.findOne(id);
    if (!billboard) {
      throw new NotFoundException(`Billboard with ID ${id} not found`);
    }

    // Soft delete - set isActive to false
    await this.billboardRepository.update(id, { isActive: false });
  }

  /**
   * Permanently delete a billboard (hard delete)
   * Use with caution - only for admin purposes
   */
  async permanentlyDelete(id: string): Promise<void> {
    const result = await this.billboardRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Billboard with ID ${id} not found`);
    }
  }

  /**
   * Restore a soft-deleted billboard
   */
  async restore(id: string): Promise<Billboard> {
    const billboard = await this.billboardRepository.findOne({ 
      where: { id },
      withDeleted: true, // This would work with @DeleteDateColumn
    });
    
    if (!billboard) {
      throw new NotFoundException(`Billboard with ID ${id} not found`);
    }

    await this.billboardRepository.update(id, { isActive: true });
    return this.findOne(id);
  }

  async findNearby(longitude: number, latitude: number, radiusKm: number = 5): Promise<Billboard[]> {
    return this.billboardRepository
      .createQueryBuilder('billboard')
      .where(
        `ST_DWithin(
          billboard.location::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius
        )`,
        {
          longitude,
          latitude,
          radius: radiusKm * 1000, // Convert km to meters
        },
      )
      .getMany();
  }
}

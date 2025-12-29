import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  async getDashboard(@Request() req) {
    const user = req.user;

    // If CLIENT, return client-specific dashboard
    if (user.role === UserRole.CLIENT) {
      return this.dashboardService.getClientDashboard(user.userId);
    }

    // If ADMIN/FINANCE/TECHNICIAN, return admin dashboard
    return this.dashboardService.getAdminDashboard();
  }

  @Get('client')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Get client dashboard (CLIENT only)' })
  @ApiResponse({ status: 200, description: 'Client dashboard retrieved successfully' })
  async getClientDashboard(@Request() req) {
    return this.dashboardService.getClientDashboard(req.user.userId);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Get admin dashboard (ADMIN/FINANCE only)' })
  @ApiResponse({ status: 200, description: 'Admin dashboard retrieved successfully' })
  async getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }
}

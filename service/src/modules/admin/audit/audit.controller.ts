import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { AdminAuditService } from './audit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  AuditListQueryDto,
  SubmitAuditResultDto,
} from './dto/audit.dto';

@Controller('api/admin/hotels')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminAuditController {
  constructor(private readonly auditService: AdminAuditService) {}

  /**
   * 获取酒店审核列表
   * GET /api/admin/hotels/audit
   */
  @Get('audit')
  async getAuditList(@Query() query: AuditListQueryDto) {
    return this.auditService.getAuditList(query);
  }

  /**
   * 获取酒店审核详情
   * GET /api/admin/hotels/:id/audit-detail
   */
  @Get(':id/audit-detail')
  async getAuditDetail(@Param('id') hotelId: string) {
    return this.auditService.getAuditDetail(hotelId);
  }

  /**
   * 提交审核结果
   * POST /api/admin/hotels/:id/audit
   */
  @Post(':id/audit')
  async submitAuditResult(
    @Param('id') hotelId: string,
    @Body() dto: SubmitAuditResultDto,
  ) {
    return this.auditService.submitAuditResult(hotelId, dto);
  }
}

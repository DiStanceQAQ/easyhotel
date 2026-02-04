import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { AdminPublishService } from './publish.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  PublishListQueryDto,
  UpdatePublishStatusDto,
} from './dto/publish.dto';

@Controller('api/admin/hotels')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPublishController {
  constructor(private readonly publishService: AdminPublishService) {}

  /**
   * 获取酒店发布列表 (已通过审核的酒店)
   * GET /api/admin/hotels/publish
   */
  @Get('publish')
  async getPublishList(@Query() query: PublishListQueryDto) {
    return this.publishService.getPublishList(query);
  }

  /**
   * 修改酒店发布状态 (上线/下线)
   * PATCH /api/admin/hotels/:id/publish
   */
  @Patch(':id/publish')
  async updatePublishStatus(
    @Param('id') hotelId: string,
    @Body() dto: UpdatePublishStatusDto,
  ) {
    return this.publishService.updatePublishStatus(hotelId, dto);
  }
}

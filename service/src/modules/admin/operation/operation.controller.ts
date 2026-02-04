import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { AdminOperationService } from './operation.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  BannerCandidateQueryDto,
  CreateBannerDto,
  UpdateBannerDto,
  CreateTagDto,
  UpdateTagDto,
} from './dto/operation.dto';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminOperationController {
  constructor(private readonly operationService: AdminOperationService) {}

  /**
   * 获取 Banner 候选酒店列表 (已通过审核且上线)
   * GET /api/admin/banners/candidate-hotels
   */
  @Get('banners/candidate-hotels')
  async getCandidateHotels(@Query() query: BannerCandidateQueryDto) {
    return this.operationService.getCandidateHotels(query);
  }

  /**
   * 获取 Banner 列表
   * GET /api/admin/banners
   */
  @Get('banners')
  async getBannerList(@Query() query: BannerCandidateQueryDto) {
    return this.operationService.getBannerList(query);
  }

  /**
   * 创建 Banner
   * POST /api/admin/banners
   */
  @Post('banners')
  async createBanner(@Body() dto: CreateBannerDto) {
    return this.operationService.createBanner(dto);
  }

  /**
   * 更新 Banner
   * PUT /api/admin/banners/:id
   */
  @Put('banners/:id')
  async updateBanner(
    @Param('id') bannerId: string,
    @Body() dto: UpdateBannerDto,
  ) {
    return this.operationService.updateBanner(bannerId, dto);
  }

  /**
   * 删除 Banner
   * DELETE /api/admin/banners/:id
   */
  @Delete('banners/:id')
  async deleteBanner(@Param('id') bannerId: string) {
    return this.operationService.deleteBanner(bannerId);
  }

  /**
   * 创建标签
   * POST /api/admin/tags
   */
  @Post('tags')
  async createTag(@Body() dto: CreateTagDto) {
    return this.operationService.createTag(dto);
  }

  /**
   * 删除标签
   * DELETE /api/admin/tags/:id
   */
  @Delete('tags/:id')
  async deleteTag(@Param('id') tagId: string) {
    return this.operationService.deleteTag(tagId);
  }
}

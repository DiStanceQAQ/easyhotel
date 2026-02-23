import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MerchantHotelsService } from './hotels.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../../common/types/auth-user';
import {
  CreateHotelDto,
  UpdateHotelDto,
  SaveHotelImagesDto,
  PaginationDto,
} from './dto/hotel.dto';

@Controller('api/merchant/hotels')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MERCHANT')
export class MerchantHotelsController {
  constructor(private readonly hotelsService: MerchantHotelsService) {}

  /**
   * 获取我的酒店列表
   * GET /api/merchant/hotels
   */
  @Get()
  async getMyHotels(
    @CurrentUser() user: AuthUser,
    @Query() pagination: PaginationDto,
  ) {
    return this.hotelsService.getMyHotels(user.userId, pagination);
  }

  /**
   * 创建酒店 (草稿)
   * POST /api/merchant/hotels
   */
  @Post()
  async createHotel(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateHotelDto,
  ) {
    return this.hotelsService.createHotel(user.userId, dto);
  }

  /**
   * 获取酒店详情 (编辑回显)
   * GET /api/merchant/hotels/:id
   */
  @Get(':id')
  async getHotelDetail(
    @CurrentUser() user: AuthUser,
    @Param('id') hotelId: string,
  ) {
    return this.hotelsService.getHotelDetail(user.userId, hotelId);
  }

  /**
   * 更新酒店信息 (保存草稿)
   * PUT /api/merchant/hotels/:id
   */
  @Put(':id')
  async updateHotel(
    @CurrentUser() user: AuthUser,
    @Param('id') hotelId: string,
    @Body() dto: UpdateHotelDto,
  ) {
    return this.hotelsService.updateHotel(user.userId, hotelId, dto);
  }

  /**
   * 管理酒店图片 (批量保存)
   * POST /api/merchant/hotels/:id/images
   */
  @Post(':id/images')
  async saveHotelImages(
    @CurrentUser() user: AuthUser,
    @Param('id') hotelId: string,
    @Body() dto: SaveHotelImagesDto,
  ) {
    return this.hotelsService.saveHotelImages(user.userId, hotelId, dto.images);
  }

  /**
   * 提交酒店审核
   * POST /api/merchant/hotels/:id/submit
   */
  @Post(':id/submit')
  async submitHotelAudit(
    @CurrentUser() user: AuthUser,
    @Param('id') hotelId: string,
  ) {
    return this.hotelsService.submitHotelAudit(user.userId, hotelId);
  }
}

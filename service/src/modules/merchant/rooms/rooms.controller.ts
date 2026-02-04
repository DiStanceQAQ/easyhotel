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
  NotFoundException,
} from '@nestjs/common';
import { MerchantRoomsService } from './rooms.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../../common/types/auth-user';
import {
  CreateRoomDto,
  UpdateRoomDto,
  UpdateRoomStatusDto,
} from './dto/room.dto';

@Controller('api/merchant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MERCHANT')
export class MerchantRoomsController {
  constructor(private readonly roomsService: MerchantRoomsService) {}

  /**
   * 获取某酒店房型列表
   * GET /api/merchant/hotels/:hotelId/rooms
   */
  @Get('hotels/:hotelId/rooms')
  async getRoomsByHotel(
    @CurrentUser() user: AuthUser,
    @Param('hotelId') hotelId: string,
  ) {
    return this.roomsService.getRoomsByHotel(user.userId, hotelId);
  }

  /**
   * 创建房型
   * POST /api/merchant/rooms
   */
  @Post('rooms')
  async createRoom(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateRoomDto,
  ) {
    return this.roomsService.createRoom(user.userId, dto);
  }

  /**
   * 更新房型
   * PUT /api/merchant/rooms/:id
   */
  @Put('rooms/:id')
  async updateRoom(
    @CurrentUser() user: AuthUser,
    @Param('id') roomId: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.updateRoom(user.userId, roomId, dto);
  }

  /**
   * 修改房型售卖状态 (上架/下架)
   * PATCH /api/merchant/rooms/:id/status
   */
  @Patch('rooms/:id/status')
  async updateRoomStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') roomId: string,
    @Body() dto: UpdateRoomStatusDto,
  ) {
    return this.roomsService.updateRoomStatus(user.userId, roomId, dto);
  }
}

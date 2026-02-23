import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateRoomDto,
  UpdateRoomDto,
  UpdateRoomStatusDto,
} from './dto/room.dto';

@Injectable()
export class MerchantRoomsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取指定酒店下的所有房型
   */
  async getRoomsByHotel(userId: string, hotelId: string) {
    // 首先验证酒店是否属于该商户
    const hotel = await (this.prisma as any).hotels.findUnique({
      where: { id: hotelId },
    });

    if (!hotel) {
      throw new NotFoundException({
        code: 40400,
        message: '酒店不存在',
      });
    }

    if (hotel.merchant_id !== userId) {
      throw new ForbiddenException({
        code: 40300,
        message: '无权限查看此酒店的房型',
      });
    }

    const rooms = await (this.prisma as any).room_types.findMany({
      where: { hotel_id: hotelId },
      select: {
        id: true,
        name: true,
        base_price: true,
        max_guests: true,
        breakfast: true,
        refundable: true,
        area_m2: true,
        cover_image: true,
        status: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      list: rooms.map(room => ({
        id: room.id,
        name: room.name,
        basePrice: room.base_price,
        maxGuests: room.max_guests,
        breakfast: room.breakfast,
        refundable: room.refundable,
        areaM2: room.area_m2,
        status: room.status,
        coverImage: room.cover_image,
        createdAt: room.created_at,
      })),
      total: rooms.length,
      hotelId,
    };
  }

  /**
   * 获取房型详情
   */
  async getRoomDetail(userId: string, roomId: string) {
    const room = await (this.prisma as any).room_types.findUnique({
      where: { id: roomId },
      include: {
        hotels: {
          select: {
            id: true,
            merchant_id: true,
            name_cn: true,
          },
        },
        room_price_calendar: {
          select: {
            date: true,
            price: true,
            stock: true,
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!room) {
      throw new NotFoundException({
        code: 40400,
        message: '房型不存在',
      });
    }

    if (room.hotels.merchant_id !== userId) {
      throw new ForbiddenException({
        code: 40300,
        message: '无权限查看此房型',
      });
    }

    return {
      id: room.id,
      hotelId: room.hotel_id,
      hotelName: room.hotels.name_cn,
      name: room.name,
      basePrice: room.base_price,
      maxGuests: room.max_guests,
      breakfast: room.breakfast,
      refundable: room.refundable,
      areaM2: room.area_m2,
      status: room.status,
      coverImage: room.cover_image,
      createdAt: room.created_at,
      updatedAt: room.updated_at,
      priceCalendar: room.room_price_calendar?.map(item => ({
        date: item.date ? new Date(item.date).toISOString().split('T')[0] : null,
        price: item.price,
        stock: item.stock,
      })) || [],
    };
  }

  /**
   * 创建房型
   */
  async createRoom(userId: string, dto: CreateRoomDto) {
    // 验证酒店是否属于该商户
    const hotel = await (this.prisma as any).hotels.findUnique({
      where: { id: dto.hotelId },
    });

    if (!hotel) {
      throw new NotFoundException({
        code: 40400,
        message: '酒店不存在',
      });
    }

    if (hotel.merchant_id !== userId) {
      throw new ForbiddenException({
        code: 40300,
        message: '无权限为此酒店创建房型',
      });
    }

    // 创建房型
    const room = await (this.prisma as any).room_types.create({
      data: {
        hotel_id: dto.hotelId,
        name: dto.name,
        base_price: dto.basePrice,
        max_guests: dto.maxGuests ?? 2,
        breakfast: dto.breakfast ?? false,
        refundable: dto.refundable ?? true,
        area_m2: dto.areaM2 ?? null,
        status: dto.status ?? 1,
        currency: dto.currency ?? 'CNY',
        cover_image: dto.coverImage ?? null,
      },
      select: {
        id: true,
        name: true,
        base_price: true,
        max_guests: true,
        breakfast: true,
        refundable: true,
        area_m2: true,
        status: true,
        cover_image: true,
        created_at: true,
      },
    });

    // 保存价格日历（如果提供了）
    if (dto.priceCalendar && Array.isArray(dto.priceCalendar) && dto.priceCalendar.length > 0) {
      await (this.prisma as any).room_price_calendar.createMany({
        data: dto.priceCalendar.map((item) => ({
          room_type_id: room.id,
          date: new Date(item.date),
          price: item.price,
          stock: item.stock ?? 10,
        })),
      });
    }

    return {
      id: room.id,
      name: room.name,
      basePrice: room.base_price,
      maxGuests: room.max_guests,
      breakfast: room.breakfast,
      refundable: room.refundable,
      areaM2: room.area_m2,
      status: room.status,
      coverImage: room.cover_image,
      createdAt: room.created_at,
    };
  }

  /**
   * 更新房型
   */
  async updateRoom(userId: string, roomId: string, dto: UpdateRoomDto) {
    const room = await (this.prisma as any).room_types.findUnique({
      where: { id: roomId },
      include: { hotels: { select: { merchant_id: true } } },
    });

    if (!room) {
      throw new NotFoundException({
        code: 40400,
        message: '房型不存在',
      });
    }

    if (room.hotels.merchant_id !== userId) {
      throw new ForbiddenException({
        code: 40300,
        message: '无权限修改此房型',
      });
    }

    const updated = await (this.prisma as any).room_types.update({
      where: { id: roomId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.basePrice !== undefined && { base_price: dto.basePrice }),
        ...(dto.maxGuests !== undefined && { max_guests: dto.maxGuests }),
        ...(dto.breakfast !== undefined && { breakfast: dto.breakfast }),
        ...(dto.refundable !== undefined && { refundable: dto.refundable }),
        ...(dto.areaM2 !== undefined && { area_m2: dto.areaM2 }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.coverImage !== undefined && { cover_image: dto.coverImage }),
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        base_price: true,
        max_guests: true,
        breakfast: true,
        refundable: true,
        area_m2: true,
        status: true,
        cover_image: true,
        updated_at: true,
      },
    });

    // 处理价格日历更新
    if (dto.priceCalendar !== undefined) {
      // 删除所有现有的价格日历记录
      await (this.prisma as any).room_price_calendar.deleteMany({
        where: { room_type_id: roomId },
      });

      // 如果提供了新的价格日历数据，创建新记录
      if (Array.isArray(dto.priceCalendar) && dto.priceCalendar.length > 0) {
        await (this.prisma as any).room_price_calendar.createMany({
          data: dto.priceCalendar.map((item) => ({
            room_type_id: roomId,
            date: new Date(item.date),
            price: item.price,
            stock: item.stock ?? 10,
          })),
        });
      }
    }

    return {
      id: updated.id,
      name: updated.name,
      basePrice: updated.base_price,
      maxGuests: updated.max_guests,
      breakfast: updated.breakfast,
      refundable: updated.refundable,
      areaM2: updated.area_m2,
      status: updated.status,
      coverImage: updated.cover_image,
      updatedAt: updated.updated_at,
    };
  }

  /**
   * 修改房型状态 (上架/下架)
   */
  async updateRoomStatus(
    userId: string,
    roomId: string,
    dto: UpdateRoomStatusDto,
  ) {
    const room = await (this.prisma as any).room_types.findUnique({
      where: { id: roomId },
      include: { hotels: { select: { merchant_id: true } } },
    });

    if (!room) {
      throw new NotFoundException({
        code: 40400,
        message: '房型不存在',
      });
    }

    if (room.hotels.merchant_id !== userId) {
      throw new ForbiddenException({
        code: 40300,
        message: '无权限修改此房型状态',
      });
    }

    const updated = await (this.prisma as any).room_types.update({
      where: { id: roomId },
      data: {
        status: dto.status,
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        status: true,
        updated_at: true,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      updatedAt: updated.updated_at,
    };
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  PublishListQueryDto,
  UpdatePublishStatusDto,
} from './dto/publish.dto';

@Injectable()
export class AdminPublishService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取已通过审核的酒店列表 (分页)
   */
  async getPublishList(query: PublishListQueryDto) {
    const skip = (query.page - 1) * query.pageSize;

    const where: any = { audit_status: 'APPROVED' };
    if (query.status) {
      where.publish_status = query.status;
    }

    const [hotels, total] = await Promise.all([
      (this.prisma as any).hotels.findMany({
        where,
        skip,
        take: query.pageSize,
        select: {
          id: true,
          name_cn: true,
          name_en: true,
          address: true,
          publish_status: true,
          users_hotels_merchant_idTousers: {
            select: {
              id: true,
              username: true,
            },
          },
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      (this.prisma as any).hotels.count({ where }),
    ]);

    return {
      list: hotels.map(h => ({
        id: h.id,
        nameCn: h.name_cn,
        nameEn: h.name_en,
        address: h.address,
        publishStatus: h.publish_status,
        merchant: h.users_hotels_merchant_idTousers,
        createdAt: h.created_at
          ? new Date(h.created_at as unknown as string | number | Date).toISOString()
          : null,
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
      hasMore: skip + query.pageSize < total,
    };
  }

  /**
   * 获取酒店发布详情
   */
  async getPublishDetail(hotelId: string) {
    const hotel = await (this.prisma as any).hotels.findUnique({
      where: { id: hotelId },
      include: {
        hotel_images: {
          select: {
            id: true,
            url: true,
            sort_order: true,
          },
          orderBy: { sort_order: 'asc' },
        },
        hotel_tags: {
          select: {
            tag_id: true,
            tags: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        users_hotels_merchant_idTousers: {
          select: {
            id: true,
            username: true,
          },
        },
        room_types: {
          select: {
            id: true,
            name: true,
            base_price: true,
            currency: true,
            max_guests: true,
            breakfast: true,
            refundable: true,
            area_m2: true,
          },
        },
      },
    });

    if (!hotel) {
      throw new NotFoundException({
        code: 40400,
        message: '酒店不存在',
      });
    }

    return {
      id: hotel.id,
      nameCn: hotel.name_cn,
      nameEn: hotel.name_en,
      city: hotel.city,
      address: hotel.address,
      lat: hotel.lat ? parseFloat(hotel.lat.toString()) : null,
      lng: hotel.lng ? parseFloat(hotel.lng.toString()) : null,
      star: hotel.star,
      openedAt: hotel.opened_at
        ? new Date(hotel.opened_at).toISOString().split('T')[0]
        : null,
      description: hotel.description,
      auditStatus: hotel.audit_status,
      publishStatus: hotel.publish_status,
      createdAt: hotel.created_at,
      updatedAt: hotel.updated_at,
      merchant: hotel.users_hotels_merchant_idTousers,
      images: hotel.hotel_images?.map((img) => ({
        id: img.id,
        url: img.url,
        sortOrder: img.sort_order,
      })) || [],
      tags: hotel.hotel_tags?.map((ht) => ({
        id: ht.tags?.id,
        name: ht.tags?.name,
      })) || [],
      roomTypes: hotel.room_types?.map((room) => ({
        id: room.id,
        name: room.name,
        basePrice: room.base_price,
        currency: room.currency,
        maxGuests: room.max_guests,
        breakfast: room.breakfast,
        refundable: room.refundable,
        areaM2: room.area_m2,
      })) || [],
    };
  }

  /**
   * 管理员强制切换酒店的上线/下线状态
   */
  async updatePublishStatus(
    hotelId: string,
    dto: UpdatePublishStatusDto,
  ) {
    const hotel = await (this.prisma as any).hotels.findUnique({
      where: { id: hotelId },
    });

    if (!hotel) {
      throw new NotFoundException({
        code: 40400,
        message: '酒店不存在',
      });
    }

    // 只有已通过审核的酒店才能修改发布状态
    if (hotel.audit_status !== 'APPROVED') {
      throw new ConflictException({
        code: 40900,
        message: '只有已通过审核的酒店才能修改发布状态',
      });
    }

    const updated = await (this.prisma as any).hotels.update({
      where: { id: hotelId },
      data: {
        publish_status: dto.status,
        updated_at: new Date(),
      },
      select: {
        id: true,
        name_cn: true,
        publish_status: true,
        updated_at: true,
      },
    });

    return {
      id: updated.id,
      nameCn: updated.name_cn,
      publishStatus: updated.publish_status,
      updatedAt: updated.updated_at,
    };
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateHotelDto,
  UpdateHotelDto,
  PaginationDto,
} from './dto/hotel.dto';

@Injectable()
export class MerchantHotelsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取商户名下的酒店列表 (分页)
   */
  async getMyHotels(userId: string, pagination: PaginationDto) {
    const skip = (pagination.page - 1) * pagination.pageSize;

    const [hotels, total] = await Promise.all([
      (this.prisma as any).hotels.findMany({
        where: { merchant_id: userId },
        skip,
        take: pagination.pageSize,
        select: {
          id: true,
          name_cn: true,
          name_en: true,
          address: true,
          audit_status: true,
          publish_status: true,
          created_at: true,
        },
      }),
      (this.prisma as any).hotels.count({ where: { merchant_id: userId } }),
    ]);

    return {
      list: hotels.map(hotel => ({
        id: hotel.id,
        nameCn: hotel.name_cn,
        nameEn: hotel.name_en,
        address: hotel.address,
        auditStatus: hotel.audit_status,
        publishStatus: hotel.publish_status,
        createdAt: hotel.created_at,
      })),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      hasMore: skip + pagination.pageSize < total,
    };
  }

  /**
   * 创建酒店 (初始状态为 DRAFT)
   */
  async createHotel(userId: string, dto: CreateHotelDto) {
    // TODO: 验证商户是否存在
    // TODO: 验证标签是否存在

    const hotel = await (this.prisma as any).hotels.create({
      data: {
        name_cn: dto.nameCn,
        name_en: dto.nameEn || '(待补充)',
        city: '(待补充)',
        address: dto.address || '(待补充)',
        star: 1,
        opened_at: new Date(),
        lat: dto.latitude ? new Decimal(dto.latitude) : null,
        lng: dto.longitude ? new Decimal(dto.longitude) : null,
        description: dto.description || '',
        merchant_id: userId,
        audit_status: 'DRAFT',
        publish_status: 'OFFLINE',
      },
      select: {
        id: true,
        name_cn: true,
        name_en: true,
        description: true,
        audit_status: true,
        publish_status: true,
        created_at: true,
      },
    });

    return {
      id: hotel.id,
      nameCn: hotel.name_cn,
      nameEn: hotel.name_en,
      description: hotel.description,
      auditStatus: hotel.audit_status,
      publishStatus: hotel.publish_status,
      createdAt: hotel.created_at,
    };
  }

  /**
   * 获取酒店详情 (编辑回显)
   */
  async getHotelDetail(userId: string, hotelId: string) {
    const hotel = await (this.prisma as any).hotels.findUnique({
      where: { id: hotelId },
      include: {
        hotel_images: {
          select: {
            id: true,
            url: true,
            display_order: true,
          },
          orderBy: { display_order: 'asc' },
        },
        hotel_tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
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

    // 验证权限：商户只能查看自己的酒店
    if (hotel.merchant_id !== userId) {
      throw new ForbiddenException({
        code: 40300,
        message: '无权限访问此酒店',
      });
    }

    return {
      id: hotel.id,
      nameCn: hotel.name_cn,
      nameEn: hotel.name_en,
      city: hotel.city,
      address: hotel.address,
      latitude: hotel.lat,
      longitude: hotel.lng,
      star: hotel.star,
      openedAt: hotel.opened_at,
      description: hotel.description,
      coverImage: hotel.cover_image,
      minPrice: hotel.min_price,
      facilities: hotel.facilities,
      auditStatus: hotel.audit_status,
      publishStatus: hotel.publish_status,
      rejectReason: hotel.reject_reason,
      approvedBy: hotel.approved_by,
      approvedAt: hotel.approved_at,
      createdAt: hotel.created_at,
      updatedAt: hotel.updated_at,
      hotelImages: hotel.hotel_images?.map(img => ({
        id: img.id,
        url: img.url,
        displayOrder: img.display_order,
      })),
      hotelTags: hotel.hotel_tags,
    };
  }

  /**
   * 更新酒店信息 (保存草稿)
   */
  async updateHotel(
    userId: string,
    hotelId: string,
    dto: UpdateHotelDto,
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

    // 验证权限
    if (hotel.merchant_id !== userId) {
      throw new ForbiddenException({
        code: 40300,
        message: '无权限修改此酒店',
      });
    }

    // 审核中或已通过的酒店不允许编辑
    if (hotel.audit_status !== 'DRAFT' && hotel.audit_status !== 'REJECTED') {
      throw new ConflictException({
        code: 40900,
        message: '审核中或已通过的酒店不允许编辑',
      });
    }

    const updated = await (this.prisma as any).hotels.update({
      where: { id: hotelId },
      data: {
        ...(dto.nameCn && { name_cn: dto.nameCn }),
        ...(dto.nameEn && { name_en: dto.nameEn }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.city && { city: dto.city }),
        ...(dto.address && { address: dto.address }),
        ...(dto.star !== undefined && { star: dto.star }),
        ...(dto.latitude !== undefined && { lat: dto.latitude ? new Decimal(dto.latitude) : null }),
        ...(dto.longitude !== undefined && { lng: dto.longitude ? new Decimal(dto.longitude) : null }),
        ...(dto.facilities && { facilities: dto.facilities }),
        updated_at: new Date(),
      },
      select: {
        id: true,
        name_cn: true,
        name_en: true,
        city: true,
        address: true,
        star: true,
        lat: true,
        lng: true,
        description: true,
        facilities: true,
        audit_status: true,
        publish_status: true,
        updated_at: true,
      },
    });

    return {
      id: updated.id,
      nameCn: updated.name_cn,
      nameEn: updated.name_en,
      city: updated.city,
      address: updated.address,
      star: updated.star,
      latitude: updated.lat,
      longitude: updated.lng,
      description: updated.description,
      facilities: updated.facilities,
      auditStatus: updated.audit_status,
      publishStatus: updated.publish_status,
      updatedAt: updated.updated_at,
    };
  }

  /**
   * 管理酒店图片 (批量保存)
   */
  async saveHotelImages(
    userId: string,
    hotelId: string,
    images: Array<{ id?: string; url: string; displayOrder: number }>,
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

    if (hotel.merchant_id !== userId) {
      throw new ForbiddenException({
        code: 40300,
        message: '无权限修改此酒店',
      });
    }

    // TODO: 删除旧图片，保存新图片
    // 使用事务确保原子性

    return {
      hotelId,
      imageCount: images.length,
    };
  }

  /**
   * 提交酒店审核 (状态变更为 PENDING)
   */
  async submitHotelAudit(userId: string, hotelId: string) {
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
        message: '无权限提交此酒店审核',
      });
    }

    // 只有 DRAFT 或 REJECTED 的酒店可以提交审核
    if (hotel.audit_status !== 'DRAFT' && hotel.audit_status !== 'REJECTED') {
      throw new ConflictException({
        code: 40900,
        message: '当前状态不允许提交审核',
      });
    }

    const updated = await (this.prisma as any).hotels.update({
      where: { id: hotelId },
      data: {
        audit_status: 'PENDING',
        updated_at: new Date(),
      },
      select: {
        id: true,
        name_cn: true,
        audit_status: true,
        updated_at: true,
      },
    });

    return {
      id: updated.id,
      nameCn: updated.name_cn,
      auditStatus: updated.audit_status,
      updatedAt: updated.updated_at,
    };
  }
}

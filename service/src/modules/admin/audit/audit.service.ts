import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AuditListQueryDto,
  SubmitAuditResultDto,
} from './dto/audit.dto';

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取待审核的酒店列表 (分页)
   */
  async getAuditList(query: AuditListQueryDto) {
    const skip = (query.page - 1) * query.pageSize;

    const [hotels, total] = await Promise.all([
      (this.prisma as any).hotels.findMany({
        where: { audit_status: 'PENDING' },
        skip,
        take: query.pageSize,
        select: {
          id: true,
          name_cn: true,
          name_en: true,
          address: true,
          audit_status: true,
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
      (this.prisma as any).hotels.count({
        where: { audit_status: 'PENDING' },
      }),
    ]);

    return {
      list: hotels.map(h => ({
        id: h.id,
        nameCn: h.name_cn,
        nameEn: h.name_en,
        address: h.address,
        auditStatus: h.audit_status,
        merchant: h.users_hotels_merchant_idTousers,
        createdAt: h.created_at,
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
      hasMore: skip + query.pageSize < total,
    };
  }

  /**
   * 获取用于审核的酒店完整信息
   */
  async getAuditDetail(hotelId: string) {
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

    return hotel;
  }

  /**
   * 提交审核结果 (通过或拒绝)
   */
  async submitAuditResult(
    hotelId: string,
    dto: SubmitAuditResultDto,
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

    // 只有审核中的酒店才能提交审核结果
    if (hotel.audit_status !== 'PENDING') {
      throw new ConflictException({
        code: 40900,
        message: '只有审核中的酒店才能提交审核结果',
      });
    }

    const updated = await (this.prisma as any).hotels.update({
      where: { id: hotelId },
      data: {
        audit_status: dto.status,
        ...(dto.status === 'REJECTED' && {
          reject_reason: dto.rejectionReason || '',
        }),
        updated_at: new Date(),
      },
      select: {
        id: true,
        name_cn: true,
        audit_status: true,
        reject_reason: true,
        updated_at: true,
      },
    });

    return {
      id: updated.id,
      nameCn: updated.name_cn,
      auditStatus: updated.audit_status,
      rejectReason: updated.reject_reason,
      updatedAt: updated.updated_at,
    };
  }
}

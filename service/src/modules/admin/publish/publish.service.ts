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
        createdAt: h.created_at,
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
      hasMore: skip + query.pageSize < total,
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

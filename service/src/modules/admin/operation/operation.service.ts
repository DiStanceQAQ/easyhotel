import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  BannerCandidateQueryDto,
  CreateBannerDto,
  UpdateBannerDto,
  CreateTagDto,
  UpdateTagDto,
} from './dto/operation.dto';

@Injectable()
export class AdminOperationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取 APPROVED 且 ONLINE 的酒店列表 (作为 Banner 的候选)
   * 排除已经有 banner 的酒店
   */
  async getCandidateHotels(query: BannerCandidateQueryDto) {
    const skip = (query.page - 1) * query.pageSize;

    // 获取已有banner的酒店ID列表
    const hotelsWithBanner = await (this.prisma as any).banners.findMany({
      select: { hotel_id: true },
      distinct: ['hotel_id'],
    });
    const bannedHotelIds = hotelsWithBanner.map(b => b.hotel_id);

    const [hotels, total] = await Promise.all([
      (this.prisma as any).hotels.findMany({
        where: {
          audit_status: 'APPROVED',
          publish_status: 'ONLINE',
          id: {
            notIn: bannedHotelIds,
          },
        },
        skip,
        take: query.pageSize,
        select: {
          id: true,
          name_cn: true,
          name_en: true,
          address: true,
          description: true,
          hotel_images: {
            select: { url: true },
            take: 1,
            orderBy: { sort_order: 'asc' },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      (this.prisma as any).hotels.count({
        where: {
          audit_status: 'APPROVED',
          publish_status: 'ONLINE',
          id: {
            notIn: bannedHotelIds,
          },
        },
      }),
    ]);

    return {
      list: hotels.map(h => ({
        id: h.id,
        nameCn: h.name_cn,
        nameEn: h.name_en,
        address: h.address,
        description: h.description,
        hotelImages: h.hotel_images,
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
      hasMore: skip + query.pageSize < total,
    };
  }

  /**
   * 获取所有首页 Banner 配置
   */
  async getBannerList(query: BannerCandidateQueryDto) {
    const skip = (query.page - 1) * query.pageSize;

    const [banners, total] = await Promise.all([
      (this.prisma as any).banners.findMany({
        skip,
        take: query.pageSize,
        select: {
          id: true,
          hotel_id: true,
          hotels: {
            select: {
              id: true,
              name_cn: true,
              name_en: true,
            },
          },
          title: true,
          image_url: true,
          is_active: true,
          sort_order: true,
          created_at: true,
        },
        orderBy: { sort_order: 'asc' },
      }),
      (this.prisma as any).banners.count(),
    ]);

    return {
      list: banners.map(b => ({
        id: b.id,
        hotelId: b.hotel_id,
        hotel: {
          id: b.hotels.id,
          nameCn: b.hotels.name_cn,
          nameEn: b.hotels.name_en,
        },
        title: b.title,
        imageUrl: b.image_url,
        isActive: b.is_active,
        displayOrder: b.sort_order,
        createdAt: b.created_at,
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
      hasMore: skip + query.pageSize < total,
    };
  }

  /**
   * 创建新的 Banner
   */
  async createBanner(dto: CreateBannerDto) {
    // 验证酒店是否存在
    const hotel = await (this.prisma as any).hotels.findUnique({
      where: { id: dto.hotelId },
    });

    if (!hotel) {
      throw new NotFoundException({
        code: 40400,
        message: '酒店不存在',
      });
    }

    // 检查该酒店是否已有 banner
    const existingBanner = await (this.prisma as any).banners.findFirst({
      where: { hotel_id: dto.hotelId },
    });

    if (existingBanner) {
      throw new ConflictException({
        code: 40900,
        message: '该酒店已有 banner，不能重复创建',
      });
    }

    const banner = await (this.prisma as any).banners.create({
      data: {
        hotel_id: dto.hotelId,
        title: dto.title,
        image_url: dto.imageUrl || '',
        is_active: dto.isActive ?? true,
        sort_order: dto.displayOrder ?? 0,
      },
      select: {
        id: true,
        hotel_id: true,
        title: true,
        image_url: true,
        is_active: true,
        sort_order: true,
        created_at: true,
      },
    });

    return {
      id: banner.id,
      hotelId: banner.hotel_id,
      title: banner.title,
      imageUrl: banner.image_url,
      isActive: banner.is_active,
      displayOrder: banner.sort_order,
      createdAt: banner.created_at,
    };
  }

  /**
   * 更新 Banner 信息
   */
  async updateBanner(bannerId: string, dto: UpdateBannerDto) {
    const banner = await (this.prisma as any).banners.findUnique({
      where: { id: bannerId },
    });

    if (!banner) {
      throw new NotFoundException({
        code: 40400,
        message: 'Banner 不存在',
      });
    }

    const updated = await (this.prisma as any).banners.update({
      where: { id: bannerId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.imageUrl && { image_url: dto.imageUrl }),
        ...(dto.isActive !== undefined && { is_active: dto.isActive }),
        ...(dto.displayOrder !== undefined && {
          sort_order: dto.displayOrder,
        }),
        updated_at: new Date(),
      },
      select: {
        id: true,
        title: true,
        is_active: true,
        sort_order: true,
        updated_at: true,
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      isActive: updated.is_active,
      displayOrder: updated.sort_order,
      updatedAt: updated.updated_at,
    };
  }

  /**
   * 物理删除一条 Banner 记录
   */
  async deleteBanner(bannerId: string) {
    const banner = await (this.prisma as any).banners.findUnique({
      where: { id: bannerId },
    });

    if (!banner) {
      throw new NotFoundException({
        code: 40400,
        message: 'Banner 不存在',
      });
    }

    await (this.prisma as any).banners.delete({
      where: { id: bannerId },
    });

    return { id: bannerId };
  }

  /**
   * 在系统字典中新增一个标签
   */
  async createTag(dto: CreateTagDto) {
    // 检查标签名称是否已存在
    const existingTag = await (this.prisma as any).tags.findUnique({
      where: { name: dto.name },
    });

    if (existingTag) {
      throw new ConflictException({
        code: 40900,
        message: '标签名称已存在',
      });
    }

    const tag = await (this.prisma as any).tags.create({
      data: {
        name: dto.name,
      },
      select: {
        id: true,
        name: true,
        created_at: true,
      },
    });

    return {
      id: tag.id,
      name: tag.name,
      createdAt: tag.created_at,
    };
  }

  /**
   * 删除标签字典项
   */
  async deleteTag(tagId: string) {
    const tag = await (this.prisma as any).tags.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      throw new NotFoundException({
        code: 40400,
        message: '标签不存在',
      });
    }

    // TODO: 检查是否有酒店关联此标签，如果有则删除关联关系或拒绝删除

    await (this.prisma as any).tags.delete({
      where: { id: tagId },
    });

    return { id: tagId };
  }
}

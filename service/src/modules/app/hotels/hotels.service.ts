import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { HotelsQueryDto } from './dto/hotels-query.dto';

export type HotelListItemDto = {
  id: string;
  nameCn: string;
  star: number;
  city: string;
  address: string;
  coverImage: string | null;
  minPrice: number | null;
  tags: string[];
};

export type HotelListResultDto = {
  list: HotelListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type HotelImageDto = {
  id: number;
  url: string;
  sortOrder: number;
};

export type HotelDetailDto = {
  id: string;
  nameCn: string;
  nameEn: string;
  star: number;
  city: string;
  address: string;
  openedAt: Date;
  facilities: unknown;
  tags: string[];
  images: HotelImageDto[];
  minPrice: number | null;
  coverImage: string | null;
  description: string | null;
};

@Injectable()
export class HotelsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: HotelsQueryDto): Promise<HotelListResultDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      audit_status: 'APPROVED',
      publish_status: 'ONLINE',
    };

    if (query.city) {
      where.city = query.city;
    }
    if (query.keyword) {
      where.OR = [
        { name_cn: { contains: query.keyword, mode: 'insensitive' } },
        { address: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }
    if (typeof query.star === 'number') {
      where.star = query.star;
    }
    if (
      typeof query.minPrice === 'number' ||
      typeof query.maxPrice === 'number'
    ) {
      where.min_price = {
        ...(typeof query.minPrice === 'number' ? { gte: query.minPrice } : {}),
        ...(typeof query.maxPrice === 'number' ? { lte: query.maxPrice } : {}),
      };
    }
    if (query.tags) {
      const tagList = query.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (tagList.length > 0) {
        // Tags strategy: any-of (match any tag).
        where.hotel_tags = {
          some: { tags: { name: { in: tagList } } },
        };
      }
    }

    const orderBy =
      query.sort === 'price_asc'
        ? { min_price: 'asc' as const }
        : { created_at: 'desc' as const };

    const [total, list] = await Promise.all([
      this.prisma.hotels.count({ where }),
      this.prisma.hotels.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          name_cn: true,
          star: true,
          city: true,
          address: true,
          cover_image: true,
          min_price: true,
          hotel_tags: {
            select: { tags: { select: { name: true } } },
          },
        },
      }),
    ]);

    const items = list.map((h) => ({
      id: h.id,
      nameCn: h.name_cn,
      star: h.star,
      city: h.city,
      address: h.address,
      coverImage: h.cover_image ?? null,
      minPrice: h.min_price ?? null,
      tags: h.hotel_tags.map((t) => t.tags.name),
    }));

    return {
      list: items,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async detail(id: string): Promise<HotelDetailDto> {
    const hotel = await this.prisma.hotels.findFirst({
      where: {
        id,
        audit_status: 'APPROVED',
        publish_status: 'ONLINE',
      },
      select: {
        id: true,
        name_cn: true,
        name_en: true,
        star: true,
        city: true,
        address: true,
        opened_at: true,
        facilities: true,
        description: true,
        cover_image: true,
        min_price: true,
        hotel_images: {
          orderBy: { sort_order: 'asc' },
          select: { id: true, url: true, sort_order: true },
        },
        hotel_tags: {
          select: { tags: { select: { name: true } } },
        },
      },
    });

    if (!hotel) {
      throw new NotFoundException({ code: 40400, message: 'hotel not found' });
    }

    return {
      id: hotel.id,
      nameCn: hotel.name_cn,
      nameEn: hotel.name_en,
      star: hotel.star,
      city: hotel.city,
      address: hotel.address,
      openedAt: hotel.opened_at,
      facilities: hotel.facilities,
      description: hotel.description ?? null,
      coverImage: hotel.cover_image ?? null,
      minPrice: hotel.min_price ?? null,
      tags: hotel.hotel_tags.map((t) => t.tags.name),
      images: hotel.hotel_images.map((img) => ({
        id: Number(img.id),
        url: img.url,
        sortOrder: img.sort_order,
      })),
    };
  }
}

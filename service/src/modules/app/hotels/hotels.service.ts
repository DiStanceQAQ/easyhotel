import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { HotelsQueryDto } from './dto/hotels-query.dto';

export type HotelListItemDto = {
  id: string;
  nameCn: string;
  nameEn: string;
  star: number;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  coverImage: string | null;
  minPrice: number | null;
  description: string | null;
  tags: string[];
  distanceMeters: number | null;
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
  lat: number | null;
  lng: number | null;
  openedAt: Date;
  facilities: unknown;
  tags: string[];
  images: HotelImageDto[];
  minPrice: number | null;
  coverImage: string | null;
  description: string | null;
  contactPhone: string | null;
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
    const andConditions: Record<string, unknown>[] = [];

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
    if (query.facilities) {
      const facilities = query.facilities
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      facilities.forEach((facility) => {
        andConditions.push({
          facilities: { path: [facility], equals: true },
        });
      });
    }

    const guestCount = (query.adults ?? 0) + (query.children ?? 0);
    if (guestCount > 0) {
      andConditions.push({
        room_types: {
          some: {
            status: 1,
            max_guests: { gte: guestCount },
          },
        },
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const orderBy =
      query.sort === 'rating_desc'
        ? [{ star: 'desc' as const }, { min_price: 'asc' as const }]
        : query.sort === 'price_asc'
          ? [{ min_price: 'asc' as const }, { created_at: 'desc' as const }]
          : query.sort === 'price_desc'
            ? [{ min_price: 'desc' as const }, { created_at: 'desc' as const }]
            : query.sort === 'star_desc'
              ? [{ star: 'desc' as const }, { created_at: 'desc' as const }]
              : query.sort === 'distance_asc'
                ? [{ created_at: 'desc' as const }]
                : [{ created_at: 'desc' as const }];
    const hasLocation =
      this.isFiniteNumber(query.lat) && this.isFiniteNumber(query.lng);
    const selectFields = {
      id: true,
      name_cn: true,
      name_en: true,
      star: true,
      city: true,
      address: true,
      lat: true,
      lng: true,
      description: true,
      cover_image: true,
      min_price: true,
      hotel_tags: {
        select: { tags: { select: { name: true } } },
      },
    };

    if (query.sort === 'distance_asc' && hasLocation) {
      const allHotels = await this.prisma.hotels.findMany({
        where,
        select: selectFields,
      });

      const ranked = allHotels
        .map((hotel) => {
          const distanceMeters = this.calculateDistanceMeters(
            query.lat!,
            query.lng!,
            this.toNullableNumber(hotel.lat),
            this.toNullableNumber(hotel.lng),
          );

          return {
            hotel,
            distanceMeters,
          };
        })
        .sort((left, right) => {
          if (left.distanceMeters == null && right.distanceMeters == null) {
            return 0;
          }
          if (left.distanceMeters == null) {
            return 1;
          }
          if (right.distanceMeters == null) {
            return -1;
          }
          return left.distanceMeters - right.distanceMeters;
        });

      const total = ranked.length;
      const list = ranked.slice(skip, skip + pageSize);
      const items = list.map((item) =>
        this.toHotelListItem(item.hotel, item.distanceMeters),
      );

      return {
        list: items,
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      };
    }

    const [total, list] = await Promise.all([
      this.prisma.hotels.count({ where }),
      this.prisma.hotels.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: selectFields,
      }),
    ]);

    const items = list.map((hotel) =>
      this.toHotelListItem(
        hotel,
        hasLocation
          ? this.calculateDistanceMeters(
              query.lat!,
              query.lng!,
              this.toNullableNumber(hotel.lat),
              this.toNullableNumber(hotel.lng),
            )
          : null,
      ),
    );

    return {
      list: items,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  private toHotelListItem(
    hotel: {
      id: string;
      name_cn: string;
      name_en: string;
      star: number;
      city: string;
      address: string;
      lat: unknown;
      lng: unknown;
      description: string | null;
      cover_image: string | null;
      min_price: number | null;
      hotel_tags: Array<{ tags: { name: string } }>;
    },
    distanceMeters: number | null,
  ): HotelListItemDto {
    return {
      id: hotel.id,
      nameCn: hotel.name_cn,
      nameEn: hotel.name_en,
      star: hotel.star,
      city: hotel.city,
      address: hotel.address,
      lat: this.toNullableNumber(hotel.lat),
      lng: this.toNullableNumber(hotel.lng),
      coverImage: hotel.cover_image ?? null,
      minPrice: hotel.min_price ?? null,
      description: hotel.description ?? null,
      tags: hotel.hotel_tags.map((tag) => tag.tags.name),
      distanceMeters,
    };
  }

  private isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  private toNullableNumber(value: unknown): number | null {
    if (value == null) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private calculateDistanceMeters(
    userLat: number,
    userLng: number,
    hotelLat: number | null,
    hotelLng: number | null,
  ): number | null {
    if (hotelLat == null || hotelLng == null) {
      return null;
    }

    const earthRadius = 6371000;
    const lat1 = this.toRadians(userLat);
    const lat2 = this.toRadians(hotelLat);
    const deltaLat = this.toRadians(hotelLat - userLat);
    const deltaLng = this.toRadians(hotelLng - userLng);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLng / 2) *
        Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(earthRadius * c);
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
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
        lat: true,
        lng: true,
        opened_at: true,
        facilities: true,
        description: true,
        cover_image: true,
        min_price: true,
        users_hotels_merchant_idTousers: {
          select: {
            merchant_profile: {
              select: {
                contact_phone: true,
              },
            },
          },
        },
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
      lat: hotel.lat == null ? null : Number(hotel.lat),
      lng: hotel.lng == null ? null : Number(hotel.lng),
      openedAt: hotel.opened_at,
      facilities: hotel.facilities,
      description: hotel.description ?? null,
      coverImage: hotel.cover_image ?? null,
      minPrice: hotel.min_price ?? null,
      contactPhone:
        hotel.users_hotels_merchant_idTousers?.merchant_profile
          ?.contact_phone ?? null,
      tags: hotel.hotel_tags.map((t) => t.tags.name),
      images: hotel.hotel_images.map((img) => ({
        id: Number(img.id),
        url: img.url,
        sortOrder: img.sort_order,
      })),
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export type BannerDto = {
  id: number;
  title: string | null;
  imageUrl: string;
  hotelId: string;
  sortOrder: number;
};

type BannerRow = {
  id: bigint;
  title: string | null;
  image_url: string;
  hotel_id: string;
  sort_order: number;
};

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(city?: string): Promise<BannerDto[]> {
    const now = new Date();
    const where = {
      is_active: true,
      AND: [
        { OR: [{ start_at: null }, { start_at: { lte: now } }] },
        { OR: [{ end_at: null }, { end_at: { gte: now } }] },
      ],
      hotels: {
        is: {
          audit_status: 'APPROVED',
          publish_status: 'ONLINE',
          ...(city ? { city } : {}),
        },
      },
    };

    const banners: BannerRow[] = await this.prisma.banners.findMany({
      where,
      orderBy: { sort_order: 'asc' },
      select: {
        id: true,
        title: true,
        image_url: true,
        hotel_id: true,
        sort_order: true,
      },
    });

    return banners.map((b) => ({
      id: Number(b.id),
      title: b.title ?? null,
      imageUrl: b.image_url,
      hotelId: b.hotel_id,
      sortOrder: b.sort_order,
    }));
  }
}

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type BannerDto = {
  id: number;
  title: string | null;
  imageUrl: string;
  hotelId: string;
  sortOrder: number;
};

type BannerRow = Prisma.bannersGetPayload<{
  select: {
    id: true;
    title: true;
    image_url: true;
    hotel_id: true;
    sort_order: true;
  };
}>;

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(city?: string): Promise<BannerDto[]> {
    const where: Prisma.bannersWhereInput = { is_active: true };
    if (city) {
      where.hotels = { is: { city } };
    }

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

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export type AppCityItemDto = {
  city: string;
  hotelCount: number;
};

export type AppCitiesResultDto = {
  list: AppCityItemDto[];
  total: number;
};

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<AppCitiesResultDto> {
    const visibleHotels = await this.prisma.hotels.findMany({
      where: {
        audit_status: 'APPROVED',
        publish_status: 'ONLINE',
      },
      select: {
        city: true,
      },
    });

    const counter = new Map<string, number>();
    for (const hotel of visibleHotels) {
      const current = counter.get(hotel.city) ?? 0;
      counter.set(hotel.city, current + 1);
    }

    const list = [...counter.entries()]
      .map(([city, hotelCount]) => ({ city, hotelCount }))
      .sort((a, b) => {
        if (b.hotelCount !== a.hotelCount) {
          return b.hotelCount - a.hotelCount;
        }
        return a.city.localeCompare(b.city, 'zh-Hans-CN');
      });

    return {
      list,
      total: list.length,
    };
  }
}

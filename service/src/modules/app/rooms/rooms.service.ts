import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export type RoomListItemDto = {
  id: number;
  name: string;
  basePrice: number;
  currency: string;
  maxGuests: number;
  breakfast: boolean;
  refundable: boolean;
  areaM2: number | null;
  coverImage: string | null;
};

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(hotelId: string): Promise<RoomListItemDto[]> {
    const hotel = await this.prisma.hotels.findFirst({
      where: {
        id: hotelId,
        audit_status: 'APPROVED',
        publish_status: 'ONLINE',
      },
      select: { id: true },
    });

    if (!hotel) {
      throw new NotFoundException({ code: 40400, message: 'hotel not found' });
    }

    const rooms = await this.prisma.room_types.findMany({
      where: {
        hotel_id: hotelId,
        status: 1,
      },
      orderBy: { base_price: 'asc' },
      select: {
        id: true,
        name: true,
        base_price: true,
        currency: true,
        max_guests: true,
        breakfast: true,
        refundable: true,
        area_m2: true,
        cover_image: true,
      },
    });

    return rooms.map((room) => ({
      id: Number(room.id),
      name: room.name,
      basePrice: room.base_price,
      currency: room.currency,
      maxGuests: room.max_guests,
      breakfast: room.breakfast,
      refundable: room.refundable,
      areaM2: room.area_m2 ?? null,
      coverImage: room.cover_image ?? null,
    }));
  }
}

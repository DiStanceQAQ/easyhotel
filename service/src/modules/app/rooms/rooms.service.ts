import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  RoomPriceCalendarQueryDto,
  RoomsQueryDto,
} from './dto/rooms-query.dto';

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
  stock: number | null;
  totalPrice: number | null;
};

export type RoomPriceCalendarItemDto = {
  date: string;
  minPrice: number | null;
  hasStock: boolean;
  low: boolean;
};

export type RoomPriceCalendarResultDto = {
  startDate: string;
  endDate: string;
  list: RoomPriceCalendarItemDto[];
};

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    hotelId: string,
    query?: RoomsQueryDto,
  ): Promise<RoomListItemDto[]> {
    await this.assertHotelVisible(hotelId);
    const guestCount = (query?.adults ?? 0) + (query?.children ?? 0);
    const stayDateKeys = this.buildStayDateKeys(
      query?.checkIn,
      query?.checkOut,
    );

    const rooms = await this.prisma.room_types.findMany({
      where: {
        hotel_id: hotelId,
        status: 1,
        ...(guestCount > 0 ? { max_guests: { gte: guestCount } } : {}),
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

    if (rooms.length === 0) {
      return [];
    }

    const calendarByRoom = await this.loadCalendarByRoom(
      rooms.map((room) => room.id),
      stayDateKeys,
    );

    return rooms
      .map((room) => {
        const calendar = calendarByRoom.get(room.id);
        const pricing = this.resolveRoomPricing(
          room.base_price,
          stayDateKeys,
          calendar,
        );

        if (!pricing.hasStock) {
          return null;
        }

        return {
          id: Number(room.id),
          name: room.name,
          basePrice: pricing.nightlyPrice,
          currency: room.currency,
          maxGuests: room.max_guests,
          breakfast: room.breakfast,
          refundable: room.refundable,
          areaM2: room.area_m2 ?? null,
          coverImage: room.cover_image ?? null,
          stock: pricing.stock,
          totalPrice: pricing.totalPrice,
        };
      })
      .filter((item): item is RoomListItemDto => item !== null);
  }

  async priceCalendar(
    hotelId: string,
    query?: RoomPriceCalendarQueryDto,
  ): Promise<RoomPriceCalendarResultDto> {
    await this.assertHotelVisible(hotelId);

    const startDate =
      this.normalizeDateString(query?.startDate) ?? this.formatDate(new Date());
    const days = query?.days ?? 180;
    const dateKeys = this.buildDateKeys(startDate, days);
    const endDate = dateKeys[dateKeys.length - 1] ?? startDate;

    const rooms = await this.prisma.room_types.findMany({
      where: {
        hotel_id: hotelId,
        status: 1,
      },
      select: {
        id: true,
        base_price: true,
      },
    });

    if (rooms.length === 0 || dateKeys.length === 0) {
      return {
        startDate,
        endDate,
        list: dateKeys.map((date) => ({
          date,
          minPrice: null,
          hasStock: false,
          low: false,
        })),
      };
    }

    const calendarRows = await this.prisma.room_price_calendar.findMany({
      where: {
        room_type_id: { in: rooms.map((room) => room.id) },
        date: {
          gte: this.parseDateAtMidnight(startDate),
          lte: this.parseDateAtMidnight(endDate),
        },
      },
      select: {
        room_type_id: true,
        date: true,
        price: true,
        stock: true,
      },
    });

    const calendarByRoom = this.groupCalendarByRoom(calendarRows);
    const list = dateKeys.map((date) => {
      const candidates: number[] = [];

      rooms.forEach((room) => {
        const roomCalendar = calendarByRoom.get(room.id);
        const day = roomCalendar?.get(date);

        if (day) {
          if (day.stock > 0) {
            candidates.push(day.price);
          }
          return;
        }

        // Fallback for days with no configured calendar row.
        candidates.push(room.base_price);
      });

      const hasStock = candidates.length > 0;
      return {
        date,
        minPrice: hasStock ? Math.min(...candidates) : null,
        hasStock,
        low: false,
      };
    });

    const minPrice = list.reduce<number | null>((current, item) => {
      if (item.minPrice == null) {
        return current;
      }
      if (current == null || item.minPrice < current) {
        return item.minPrice;
      }
      return current;
    }, null);

    const markedLow = list.map((item) => ({
      ...item,
      low:
        minPrice != null &&
        item.minPrice != null &&
        item.minPrice <= minPrice + 12,
    }));

    return {
      startDate,
      endDate,
      list: markedLow,
    };
  }

  private async assertHotelVisible(hotelId: string): Promise<void> {
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
  }

  private async loadCalendarByRoom(
    roomTypeIds: bigint[],
    stayDateKeys: string[],
  ): Promise<Map<bigint, Map<string, { price: number; stock: number }>>> {
    if (roomTypeIds.length === 0 || stayDateKeys.length === 0) {
      return new Map();
    }

    const startDate = stayDateKeys[0];
    const endExclusive = this.addDays(startDate, stayDateKeys.length);
    if (!endExclusive) {
      return new Map();
    }

    const rows = await this.prisma.room_price_calendar.findMany({
      where: {
        room_type_id: { in: roomTypeIds },
        date: {
          gte: this.parseDateAtMidnight(startDate),
          lt: this.parseDateAtMidnight(endExclusive),
        },
      },
      select: {
        room_type_id: true,
        date: true,
        price: true,
        stock: true,
      },
    });

    return this.groupCalendarByRoom(rows);
  }

  private resolveRoomPricing(
    basePrice: number,
    stayDateKeys: string[],
    calendarByDate?: Map<string, { price: number; stock: number }>,
  ): {
    nightlyPrice: number;
    totalPrice: number | null;
    stock: number | null;
    hasStock: boolean;
  } {
    if (stayDateKeys.length === 0) {
      return {
        nightlyPrice: basePrice,
        totalPrice: null,
        stock: null,
        hasStock: true,
      };
    }

    let totalPrice = 0;
    let pricedDays = 0;
    let minStock = Number.MAX_SAFE_INTEGER;
    let hasMissingCalendar = false;

    for (const dateKey of stayDateKeys) {
      const day = calendarByDate?.get(dateKey);
      if (!day) {
        hasMissingCalendar = true;
        continue;
      }

      if (day.stock <= 0) {
        return {
          nightlyPrice: basePrice,
          totalPrice: null,
          stock: 0,
          hasStock: false,
        };
      }

      totalPrice += day.price;
      pricedDays += 1;
      minStock = Math.min(minStock, day.stock);
    }

    if (hasMissingCalendar || pricedDays !== stayDateKeys.length) {
      return {
        nightlyPrice: basePrice,
        totalPrice: null,
        stock: null,
        hasStock: true,
      };
    }

    return {
      nightlyPrice: Math.round(totalPrice / stayDateKeys.length),
      totalPrice,
      stock: Number.isFinite(minStock) ? minStock : null,
      hasStock: true,
    };
  }

  private groupCalendarByRoom(
    rows: Array<{
      room_type_id: bigint;
      date: Date;
      price: number;
      stock: number;
    }>,
  ): Map<bigint, Map<string, { price: number; stock: number }>> {
    const grouped = new Map<
      bigint,
      Map<string, { price: number; stock: number }>
    >();

    rows.forEach((row) => {
      const key = this.formatDate(row.date);
      const roomMap =
        grouped.get(row.room_type_id) ??
        new Map<string, { price: number; stock: number }>();
      roomMap.set(key, { price: row.price, stock: row.stock });
      grouped.set(row.room_type_id, roomMap);
    });

    return grouped;
  }

  private buildStayDateKeys(checkIn?: string, checkOut?: string): string[] {
    const inDate = this.normalizeDateString(checkIn);
    const outDate = this.normalizeDateString(checkOut);
    if (!inDate || !outDate || outDate <= inDate) {
      return [];
    }

    const keys: string[] = [];
    let cursor = this.parseDateAtMidnight(inDate);
    const end = this.parseDateAtMidnight(outDate);

    while (cursor < end) {
      keys.push(this.formatDate(cursor));
      cursor = this.addDaysToDate(cursor, 1);
    }

    return keys;
  }

  private buildDateKeys(startDate: string, days: number): string[] {
    if (days <= 0) {
      return [];
    }

    const normalizedStart = this.normalizeDateString(startDate);
    if (!normalizedStart) {
      return [];
    }

    const list: string[] = [];
    for (let index = 0; index < days; index += 1) {
      const next = this.addDays(normalizedStart, index);
      if (!next) {
        break;
      }
      list.push(next);
    }
    return list;
  }

  private addDays(dateString: string, days: number): string | null {
    const start = this.normalizeDateString(dateString);
    if (!start) {
      return null;
    }

    const date = this.parseDateAtMidnight(start);
    date.setDate(date.getDate() + days);
    return this.formatDate(date);
  }

  private addDaysToDate(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private parseDateAtMidnight(value: string): Date {
    return new Date(`${value}T00:00:00`);
  }

  private normalizeDateString(value?: string): string | null {
    if (!value) {
      return null;
    }

    const date = this.parseDateAtMidnight(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return this.formatDate(date);
  }

  private formatDate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

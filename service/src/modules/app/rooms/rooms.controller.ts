import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  RoomPriceCalendarQueryDto,
  RoomsQueryDto,
} from './dto/rooms-query.dto';
import { RoomsService } from './rooms.service';

@Controller('app/hotels')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get(':id/rooms')
  list(@Param('id') id: string, @Query() query: RoomsQueryDto) {
    return this.roomsService.list(id, query);
  }

  @Get(':id/price-calendar')
  priceCalendar(
    @Param('id') id: string,
    @Query() query: RoomPriceCalendarQueryDto,
  ) {
    return this.roomsService.priceCalendar(id, query);
  }
}

import { Controller, Get, Param } from '@nestjs/common';
import { RoomsService } from './rooms.service';

@Controller('app/hotels')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get(':id/rooms')
  list(@Param('id') id: string) {
    return this.roomsService.list(id);
  }
}

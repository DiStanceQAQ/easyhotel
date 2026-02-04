import { Controller, Get, Param, Query } from '@nestjs/common';
import { HotelsQueryDto } from './dto/hotels-query.dto';
import { HotelsService } from './hotels.service';

@Controller('app/hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get()
  list(@Query() query: HotelsQueryDto) {
    return this.hotelsService.list(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.hotelsService.detail(id);
  }
}

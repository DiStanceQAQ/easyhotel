import { Controller, Get, Query } from '@nestjs/common';
import { LocationReverseQueryDto } from './dto/location-reverse-query.dto';
import { LocationService } from './location.service';

@Controller('app/location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('reverse')
  async reverse(@Query() query: LocationReverseQueryDto) {
    return this.locationService.reverse(query);
  }
}

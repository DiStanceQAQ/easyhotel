import { Controller, Get, Query } from '@nestjs/common';
import { BannersService } from './banners.service';

@Controller('app')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get('banners')
  async list(@Query('city') city?: string) {
    return this.bannersService.list(city);
  }
}

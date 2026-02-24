import { Controller, Get } from '@nestjs/common';
import { CitiesService } from './cities.service';

@Controller('app')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get('cities')
  async list() {
    return this.citiesService.list();
  }
}

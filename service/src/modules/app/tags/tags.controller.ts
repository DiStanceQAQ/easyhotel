import { Controller, Get } from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller('app')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('tags')
  async list() {
    return this.tagsService.list();
  }
}

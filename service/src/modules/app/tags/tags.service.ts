import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export type AppTagItemDto = {
  id: string;
  name: string;
};

export type AppTagsResultDto = {
  list: AppTagItemDto[];
  total: number;
};

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<AppTagsResultDto> {
    const tags = await this.prisma.tags.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    const list = tags.map((tag) => ({
      id: tag.id.toString(),
      name: tag.name,
    }));

    return {
      list,
      total: list.length,
    };
  }
}

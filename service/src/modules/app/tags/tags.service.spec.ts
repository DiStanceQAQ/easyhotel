import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { TagsService } from './tags.service';

describe('TagsService', () => {
  it('returns tags ordered by id asc and serializes id as string', async () => {
    const findMany = jest.fn().mockResolvedValue([
      { id: BigInt(1), name: '亲子' },
      { id: BigInt(2), name: '免费停车' },
    ]);
    const prisma = { tags: { findMany } } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [TagsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    const service = moduleRef.get(TagsService);
    const result = await service.list();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { id: 'asc' },
      }),
    );
    expect(result).toEqual({
      list: [
        { id: '1', name: '亲子' },
        { id: '2', name: '免费停车' },
      ],
      total: 2,
    });
  });
});

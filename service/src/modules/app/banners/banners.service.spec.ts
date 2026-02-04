import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { BannersService } from './banners.service';

describe('BannersService', () => {
  it('filters by isActive and orders by sortOrder', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = { banners: { findMany } } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [BannersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    const service = moduleRef.get(BannersService);
    await service.list();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { is_active: true },
        orderBy: { sort_order: 'asc' },
      }),
    );
  });
});

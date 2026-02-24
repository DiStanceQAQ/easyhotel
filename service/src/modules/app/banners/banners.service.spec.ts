import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { BannersService } from './banners.service';

describe('BannersService', () => {
  it('filters by visibility and orders by sortOrder', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = { banners: { findMany } } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [BannersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    const service = moduleRef.get(BannersService);
    await service.list();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          is_active: true,
          hotels: {
            is: {
              audit_status: 'APPROVED',
              publish_status: 'ONLINE',
            },
          },
        }),
        orderBy: { sort_order: 'asc' },
      }),
    );
  });
});

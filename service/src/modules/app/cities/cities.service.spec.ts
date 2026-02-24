import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { CitiesService } from './cities.service';

describe('CitiesService', () => {
  it('returns visible cities with count and sort by count desc', async () => {
    const findMany = jest.fn().mockResolvedValue([
      { city: '深圳' },
      { city: '广州' },
      { city: '深圳' },
      { city: '上海' },
      { city: '广州' },
      { city: '深圳' },
    ]);
    const prisma = {
      hotels: {
        findMany,
      },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [CitiesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    const service = moduleRef.get(CitiesService);
    const result = await service.list();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          audit_status: 'APPROVED',
          publish_status: 'ONLINE',
        },
      }),
    );
    expect(result).toEqual({
      list: [
        { city: '深圳', hotelCount: 3 },
        { city: '广州', hotelCount: 2 },
        { city: '上海', hotelCount: 1 },
      ],
      total: 3,
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { HotelsService } from './hotels.service';

describe('HotelsService', () => {
  it('always filters approved and online', async () => {
    const count = jest.fn().mockResolvedValue(0);
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      hotels: {
        count,
        findMany,
      },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [HotelsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    const service = moduleRef.get<HotelsService>(HotelsService);
    await service.list({});

    expect(count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          audit_status: 'APPROVED',
          publish_status: 'ONLINE',
        },
      }),
    );
  });

  it('applies price range filters', async () => {
    const count = jest.fn().mockResolvedValue(0);
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      hotels: {
        count,
        findMany,
      },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [HotelsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    const service = moduleRef.get<HotelsService>(HotelsService);
    await service.list({ minPrice: 100, maxPrice: 200 });

    const calls = findMany.mock.calls as Array<[unknown]>;
    const args = calls[0]?.[0] as {
      where?: { min_price?: { gte?: number; lte?: number } };
    };
    expect(args.where?.min_price).toEqual({ gte: 100, lte: 200 });
  });

  it('sorts by min price when price_asc', async () => {
    const count = jest.fn().mockResolvedValue(0);
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      hotels: {
        count,
        findMany,
      },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [HotelsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    const service = moduleRef.get<HotelsService>(HotelsService);
    await service.list({ sort: 'price_asc' });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { min_price: 'asc' },
      }),
    );
  });

  it('paginates with correct offset', async () => {
    const count = jest.fn().mockResolvedValue(25);
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      hotels: {
        count,
        findMany,
      },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [HotelsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    const service = moduleRef.get<HotelsService>(HotelsService);
    const result = await service.list({ page: 2, pageSize: 10 });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      }),
    );
    expect(result.hasMore).toBe(true);
  });

  it('returns detail with images and tags', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      id: 'hotel-1',
      name_cn: 'CN',
      name_en: 'EN',
      star: 5,
      city: 'SZ',
      address: 'addr',
      opened_at: new Date('2020-01-01'),
      facilities: {},
      description: 'desc',
      cover_image: null,
      min_price: 199,
      hotel_images: [{ id: BigInt(1), url: 'img', sort_order: 2 }],
      hotel_tags: [{ tags: { name: 'tag1' } }],
    });
    const prisma = {
      hotels: {
        findFirst,
      },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [HotelsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    const service = moduleRef.get<HotelsService>(HotelsService);
    const result = await service.detail('hotel-1');

    expect(result.images).toEqual([{ id: 1, url: 'img', sortOrder: 2 }]);
    expect(result.tags).toEqual(['tag1']);
  });

  it('throws not found when hotel is invisible', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const prisma = {
      hotels: {
        findFirst,
      },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [HotelsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    const service = moduleRef.get<HotelsService>(HotelsService);
    await expect(service.detail('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

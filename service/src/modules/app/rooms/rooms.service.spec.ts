import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { RoomsService } from './rooms.service';

describe('RoomsService', () => {
  it('throws not found when hotel is invisible', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const findMany = jest.fn();
    const prisma: PrismaService = {
      hotels: { findFirst },
      room_types: { findMany },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [RoomsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    const service = moduleRef.get(RoomsService);
    await expect(service.list('hotel-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(findMany).not.toHaveBeenCalled();
  });

  it('filters by status and sorts by base price', async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: 'hotel-1' });
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma: PrismaService = {
      hotels: { findFirst },
      room_types: { findMany },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [RoomsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    const service = moduleRef.get(RoomsService);
    await service.list('hotel-1');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { hotel_id: 'hotel-1', status: 1 },
        orderBy: { base_price: 'asc' },
      }),
    );
  });
});

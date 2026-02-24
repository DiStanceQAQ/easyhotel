import { Test } from '@nestjs/testing';
import { CitiesController } from './cities.controller';
import { CitiesService } from './cities.service';

describe('CitiesController', () => {
  it('returns data from service list()', async () => {
    const expected = {
      list: [{ city: '深圳', hotelCount: 12 }],
      total: 1,
    };
    const list = jest.fn().mockResolvedValue(expected);

    const moduleRef = await Test.createTestingModule({
      controllers: [CitiesController],
      providers: [{ provide: CitiesService, useValue: { list } }],
    }).compile();

    const controller = moduleRef.get(CitiesController);
    await expect(controller.list()).resolves.toEqual(expected);
    expect(list).toHaveBeenCalledTimes(1);
  });
});

import { Test } from '@nestjs/testing';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

describe('TagsController', () => {
  it('returns data from service list()', async () => {
    const expected = {
      list: [{ id: '1', name: '亲子' }],
      total: 1,
    };
    const list = jest.fn().mockResolvedValue(expected);

    const moduleRef = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [{ provide: TagsService, useValue: { list } }],
    }).compile();

    const controller = moduleRef.get(TagsController);
    await expect(controller.list()).resolves.toEqual(expected);
    expect(list).toHaveBeenCalledTimes(1);
  });
});

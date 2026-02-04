import { Test } from '@nestjs/testing';
import { AppController } from './modules/app/app.controller';
import { AppService } from './modules/app/app.service';

describe('AppController', () => {
  it('returns hello message', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    const controller = moduleRef.get(AppController);
    expect(controller.getHello()).toEqual({ message: 'Hello World!' });
  });
});

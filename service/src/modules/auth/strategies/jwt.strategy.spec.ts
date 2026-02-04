import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('maps payload to request user', () => {
    const config = { get: () => 'secret' } as unknown as ConfigService;
    const strategy = new JwtStrategy(config);
    const result = strategy.validate({ sub: 'u1', role: 'ADMIN' });
    expect(result).toEqual({ userId: 'u1', role: 'ADMIN' });
  });
});

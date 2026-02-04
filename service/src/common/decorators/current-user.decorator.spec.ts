import { ExecutionContext } from '@nestjs/common';
import { getCurrentUserFromContext } from './current-user.decorator';

describe('CurrentUser decorator', () => {
  it('extracts user from request', () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { userId: 'u1', role: 'ADMIN' } }),
      }),
    } as unknown as ExecutionContext;

    const result = getCurrentUserFromContext(ctx);
    expect(result).toEqual({ userId: 'u1', role: 'ADMIN' });
  });
});

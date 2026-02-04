import 'reflect-metadata';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  it('allows when role matches', () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);
    const handler = () => null;
    Reflect.defineMetadata(ROLES_KEY, ['ADMIN'], handler);

    const context = {
      getHandler: () => handler,
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'ADMIN' } }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws when role does not match', () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);
    const handler = () => null;
    Reflect.defineMetadata(ROLES_KEY, ['ADMIN'], handler);

    const context = {
      getHandler: () => handler,
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'MERCHANT' } }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});

import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    users: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let jwt: { signAsync: jest.Mock };

  beforeEach(async () => {
    prisma = {
      users: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwt = { signAsync: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('register creates new user', async () => {
    prisma.users.findUnique.mockResolvedValue(null);
    prisma.users.create.mockResolvedValue({
      id: 'u1',
      username: 'test',
      role: 'MERCHANT',
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    const result = await service.register({
      username: 'test',
      password: 'pwd',
      role: 'MERCHANT',
    });

    expect(prisma.users.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 'u1', username: 'test', role: 'MERCHANT' });
  });

  it('register throws conflict when username exists', async () => {
    prisma.users.findUnique.mockResolvedValue({ id: 'u1' });
    await expect(
      service.register({ username: 'test', password: 'pwd', role: 'MERCHANT' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('login returns token for valid password', async () => {
    prisma.users.findUnique.mockResolvedValue({
      id: 'u1',
      username: 'test',
      role: 'ADMIN',
      password: 'hashed',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwt.signAsync.mockResolvedValue('token');

    const result = await service.login({ username: 'test', password: 'pwd' });

    expect(result.token).toBe('token');
    expect(result.user).toEqual({ id: 'u1', username: 'test', role: 'ADMIN' });
  });

  it('login throws unauthorized on bad password', async () => {
    prisma.users.findUnique.mockResolvedValue({
      id: 'u1',
      username: 'test',
      role: 'ADMIN',
      password: 'hashed',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({ username: 'test', password: 'pwd' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

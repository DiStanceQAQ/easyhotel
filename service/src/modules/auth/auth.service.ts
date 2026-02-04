import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthRole } from '../../common/types/auth-user';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthLoginResult, AuthUserDto } from './types/auth-types';

type UserRecord = {
  id: string;
  username: string;
  password: string;
  role: AuthRole;
};

type UsersDelegate = {
  findUnique: (args: {
    where: { username?: string; id?: string };
  }) => Promise<UserRecord | null>;
  create: (args: {
    data: { username: string; password: string; role: AuthRole };
  }) => Promise<UserRecord>;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private get users(): UsersDelegate {
    return (this.prisma as unknown as { users: UsersDelegate }).users;
  }

  async register(dto: RegisterDto): Promise<AuthUserDto> {
    const existing = await this.users.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException({ code: 40900, message: '用户名已存在' });
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      data: {
        username: dto.username,
        password: hashed,
        role: dto.role,
      },
    });

    return { id: user.id, username: user.username, role: user.role };
  }

  async login(dto: LoginDto): Promise<AuthLoginResult> {
    const user = await this.users.findUnique({
      where: { username: dto.username },
    });
    if (!user) {
      throw new UnauthorizedException({
        code: 40100,
        message: '用户名或密码错误',
      });
    }

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) {
      throw new UnauthorizedException({
        code: 40100,
        message: '用户名或密码错误',
      });
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });

    return {
      token,
      user: { id: user.id, username: user.username, role: user.role },
    };
  }

  async me(userId: string): Promise<AuthUserDto> {
    const user = await this.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException({ code: 40100, message: '登录已失效' });
    }
    return { id: user.id, username: user.username, role: user.role };
  }
}

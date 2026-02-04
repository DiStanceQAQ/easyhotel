import { AuthRole } from './auth-user';

export type JwtPayload = {
  sub: string;
  role: AuthRole;
};

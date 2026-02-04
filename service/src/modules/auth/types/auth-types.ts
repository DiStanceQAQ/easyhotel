import { AuthRole } from '../../../common/types/auth-user';

export type AuthUserDto = {
  id: string;
  username: string;
  role: AuthRole;
};

export type AuthLoginResult = {
  token: string;
  user: AuthUserDto;
};

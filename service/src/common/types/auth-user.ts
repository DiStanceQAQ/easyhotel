export type AuthRole = 'ADMIN' | 'MERCHANT';

export type AuthUser = {
  userId: string;
  role: AuthRole;
};

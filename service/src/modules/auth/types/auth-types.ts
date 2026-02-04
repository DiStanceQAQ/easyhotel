import { AuthRole } from '../../../common/types/auth-user';

export type MerchantProfileDto = {
  merchantName: string;
  contactName?: string | null;
  contactPhone?: string | null;
};

export type MerchantHotelDto = {
  id: string;
  nameCn: string;
  nameEn: string;
  city: string;
  address: string;
  auditStatus: string;
  publishStatus: string;
};

export type AuthUserDto = {
  id: string;
  username: string;
  role: AuthRole;
  merchantProfile?: MerchantProfileDto | null;
  hotels?: MerchantHotelDto[];
};

export type AuthLoginResult = {
  token: string;
  user: AuthUserDto;
};

import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsIn(['ADMIN', 'MERCHANT'])
  role!: 'ADMIN' | 'MERCHANT';
}

import { IsString, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  /**
   * 商户名称（企业名）
   */
  @IsString()
  merchantName: string;

  /**
   * 联系人名称
   */
  @IsString()
  @IsOptional()
  contactName?: string;

  /**
   * 联系人电话
   */
  @IsString()
  @IsOptional()
  contactPhone?: string;
}

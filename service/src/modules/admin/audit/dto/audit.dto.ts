import { IsString, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AuditListQueryDto {
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  pageSize: number = 10;
}

export class SubmitAuditResultDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

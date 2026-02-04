import { IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class PublishListQueryDto {
  @IsOptional()
  @IsEnum(['ONLINE', 'OFFLINE'], { message: '状态只能为 ONLINE 或 OFFLINE' })
  status?: 'ONLINE' | 'OFFLINE';

  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  pageSize: number = 10;
}

export class UpdatePublishStatusDto {
  @IsEnum(['ONLINE', 'OFFLINE'])
  status: 'ONLINE' | 'OFFLINE';
}

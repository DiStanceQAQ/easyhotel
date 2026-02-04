import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomDto {
  @IsString()
  hotelId: string;

  @IsString()
  name: string;

  @IsNumber()
  @Type(() => Number)
  basePrice: number;

  @IsNumber()
  @Type(() => Number)
  maxGuests: number;

  @IsBoolean()
  @IsOptional()
  breakfast?: boolean;

  @IsBoolean()
  @IsOptional()
  refundable?: boolean;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  areaM2?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  status?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  stockMgtType?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  totalStock?: number;
}

export class UpdateRoomDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  basePrice?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  maxGuests?: number;

  @IsBoolean()
  @IsOptional()
  breakfast?: boolean;

  @IsBoolean()
  @IsOptional()
  refundable?: boolean;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  areaM2?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  status?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  stockMgtType?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  totalStock?: number;
}

export class UpdateRoomStatusDto {
  @IsNumber()
  @Type(() => Number)
  status: number;
}

import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHotelDto {
  @IsString()
  nameCn: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  lat?: number;

  @IsNumber()
  @IsOptional()
  lng?: number;

  @IsArray()
  @Type(() => Number)
  @IsOptional()
  tagIds?: number[];
}

export class UpdateHotelDto {
  @IsString()
  @IsOptional()
  nameCn?: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  star?: number;

  @IsString()
  @IsOptional()
  openedAt?: string;

  @IsNumber()
  @IsOptional()
  lat?: number;

  @IsNumber()
  @IsOptional()
  lng?: number;

  @IsObject()
  @IsOptional()
  facilities?: Record<string, any>;

  @IsArray()
  @Type(() => Number)
  @IsOptional()
  tagIds?: number[];
}

export class ImageDto {
  @IsString()
  url: string;

  @IsNumber()
  sortOrder: number;
}

export class SaveHotelImagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images: ImageDto[];
}

export class PaginationDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page: number = 1;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  pageSize: number = 10;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  auditStatus?: string;
}

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
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsArray()
  @Type(() => String)
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  images?: Array<{ url: string; displayOrder: number }>;
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

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsObject()
  @IsOptional()
  facilities?: Record<string, any>;

  @IsArray()
  @Type(() => String)
  @IsOptional()
  tagIds?: string[];
}

export class SaveHotelImagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  images: Array<{ id?: string; url: string; displayOrder: number }>;
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
}

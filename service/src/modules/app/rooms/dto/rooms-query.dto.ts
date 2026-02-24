import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class RoomsQueryDto {
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(9)
  adults?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(9)
  children?: number;
}

export class RoomPriceCalendarQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(7)
  @Max(365)
  days?: number;
}

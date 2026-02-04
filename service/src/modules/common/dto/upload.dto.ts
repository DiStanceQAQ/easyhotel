import { IsNotEmpty } from 'class-validator';
import type { Multer } from 'multer';

export class UploadFileDto {
  @IsNotEmpty()
  file: Multer.File;
}

export class UploadResponseDto {
  url: string;
  filename: string;
  size: number;
}

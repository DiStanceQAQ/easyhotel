import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';
import { CommonService } from './common.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadResponseDto } from './dto/upload.dto';

@Controller('api/common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  /**
   * 获取所有标签列表
   * GET /api/common/tags
   */
  @UseGuards(JwtAuthGuard)
  @Get('tags')
  async getTags() {
    return this.commonService.getTags();
  }

  /**
   * 通用文件上传
   * POST /api/common/upload
   */
  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Multer.File,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException({
        code: 40000,
        message: '文件不能为空',
      });
    }
    return this.commonService.uploadFile(file);
  }

}

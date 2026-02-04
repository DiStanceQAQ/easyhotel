import { Injectable, BadRequestException } from '@nestjs/common';
import type { Multer } from 'multer';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadResponseDto } from './dto/upload.dto';
import { put } from '@vercel/blob';

@Injectable()
export class CommonService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取系统预设的所有标签字典
   */
  async getTags() {
    try {
      const tags = await this.prisma.tags.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          id: 'asc',
        },
      });

      // 将 BigInt id 转换为字符串以便 JSON 序列化
      const formattedTags = tags.map(tag => ({
        id: tag.id.toString(),
        name: tag.name,
      }));

      return {
        list: formattedTags,
        total: formattedTags.length,
      };
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  /**
   * 接收文件流，上传到 Vercel Blob，返回可访问的 URL
   * 使用环境变量 BLOB_READ_WRITE_TOKEN 作为身份验证
   */
  async uploadFile(file: Multer.File): Promise<UploadResponseDto> {
    // 1. 文件验证
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('只支持 jpg/png/webp 格式的图片');
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new BadRequestException('文件大小不能超过 2MB');
    }

    try {
      // 2. 上传到 Vercel Blob
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token) {
        throw new Error('BLOB_READ_WRITE_TOKEN not configured');
      }

      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
      const blob = await put(filename, file.buffer, {
        access: 'public',
        token,
      });

      // 3. 返回 URL
      return {
        url: blob.url,
        filename: blob.pathname,
        size: file.size,
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw new BadRequestException(`文件上传失败: ${error.message}`);
    }
  }
}

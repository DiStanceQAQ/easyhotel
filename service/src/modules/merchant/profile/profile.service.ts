import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  /**
   * 完善/修改商户资料 (Upsert 操作)
   * 如果商户资料不存在则创建，存在则更新
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.merchant_profile.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        merchant_name: dto.merchantName,
        contact_name: dto.contactName || null,
        contact_phone: dto.contactPhone || null,
      },
      update: {
        merchant_name: dto.merchantName,
        contact_name: dto.contactName || null,
        contact_phone: dto.contactPhone || null,
      },
    });
  }

  /**
   * 获取商户资料
   */
  async getProfile(userId: string) {
    return this.prisma.merchant_profile.findUnique({
      where: { user_id: userId },
    });
  }
}

import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/profile.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../../common/types/auth-user';

@Controller('api/merchant/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * 完善/修改商户资料
   * POST /api/merchant/profile
   * 权限: MERCHANT
   * 说明: 商户完善或更新自己的企业及联系人信息 (Upsert 操作)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.profileService.updateProfile(user.userId, dto);
    return {
      code: 0,
      message: 'ok',
      data: null,
    };
  }
}

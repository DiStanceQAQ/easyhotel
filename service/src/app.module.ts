import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppApiModule } from './modules/app/app.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from './modules/common/common.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { AdminModule } from './modules/admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AppApiModule,
    AuthModule,
    CommonModule,
    MerchantModule,
    AdminModule,
  ],
})
export class AppModule {}

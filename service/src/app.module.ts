import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppApiModule } from './modules/app/app.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AppApiModule,
    AuthModule,
  ],
})
export class AppModule {}

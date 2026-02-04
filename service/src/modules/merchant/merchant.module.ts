import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MerchantHotelsController } from './hotels/hotels.controller';
import { MerchantHotelsService } from './hotels/hotels.service';
import { MerchantRoomsController } from './rooms/rooms.controller';
import { MerchantRoomsService } from './rooms/rooms.service';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [PrismaModule, ProfileModule],
  controllers: [MerchantHotelsController, MerchantRoomsController],
  providers: [MerchantHotelsService, MerchantRoomsService],
})
export class MerchantModule {}

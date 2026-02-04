import { Module } from '@nestjs/common';
import { BannersModule } from './banners/banners.module';
import { HotelsModule } from './hotels/hotels.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [BannersModule, HotelsModule, RoomsModule],
})
export class AppApiModule {}

import { Module } from '@nestjs/common';
import { BannersModule } from './banners/banners.module';
import { CitiesModule } from './cities/cities.module';
import { HotelsModule } from './hotels/hotels.module';
import { LocationModule } from './location/location.module';
import { RoomsModule } from './rooms/rooms.module';
import { TagsModule } from './tags/tags.module';

@Module({
  imports: [
    BannersModule,
    HotelsModule,
    RoomsModule,
    TagsModule,
    CitiesModule,
    LocationModule,
  ],
})
export class AppApiModule {}

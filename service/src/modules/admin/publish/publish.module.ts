import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminPublishController } from './publish.controller';
import { AdminPublishService } from './publish.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminPublishController],
  providers: [AdminPublishService],
})
export class AdminPublishModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminOperationController } from './operation.controller';
import { AdminOperationService } from './operation.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminOperationController],
  providers: [AdminOperationService],
})
export class AdminOperationModule {}

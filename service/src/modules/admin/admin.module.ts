import { Module } from '@nestjs/common';
import { AdminAuditModule } from './audit/audit.module';
import { AdminPublishModule } from './publish/publish.module';
import { AdminOperationModule } from './operation/operation.module';

@Module({
  imports: [AdminAuditModule, AdminPublishModule, AdminOperationModule],
})
export class AdminModule {}

import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller'; // ✨ 引入 Controller
import { LoginLog } from './entities/login-log.entity';
import { AuditLog } from './entities/audit-log.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([LoginLog, AuditLog])],
  controllers: [LogsController], // ✨ 註冊 Controller
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}
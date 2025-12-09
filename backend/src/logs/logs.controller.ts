import { Controller, Get, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('logs')
@UseGuards(JwtAuthGuard) // 只有登入的管理員才能看
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  // 取得登入日誌
  @Get('login')
  getLoginLogs() {
    return this.logsService.getRecentLogins();
  }

  // 取得操作日誌
  @Get('audit')
  getAuditLogs() {
    return this.logsService.getRecentAuditLogs();
  }
}
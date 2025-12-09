import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginLog } from './entities/login-log.entity';
import { AuditLog } from './entities/audit-log.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(LoginLog)
    private loginRepo: Repository<LoginLog>,
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  // 記錄登入
  async logLogin(user: User, ip: string, userAgent: string) {
    const log = this.loginRepo.create({ user, ip, userAgent, success: true });
    return this.loginRepo.save(log);
  }

  // 記錄操作
  async logAction(user: User, action: string, targetEntity: string, targetId: string, details?: any) {
    const log = this.auditRepo.create({ user, action, targetEntity, targetId, details });
    return this.auditRepo.save(log);
  }

  // 查詢最近登入紀錄
  async getRecentLogins(limit = 50) {
    return this.loginRepo.find({
      relations: ['user', 'user.dealerProfile'],
      order: { loginAt: 'DESC' },
      take: limit,
    });
  }

  // ✨✨✨ 新增：查詢最近操作紀錄 ✨✨✨
  async getRecentAuditLogs(limit = 50) {
    return this.auditRepo.find({
      relations: ['user', 'user.dealerProfile'], // 關聯使用者資料
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
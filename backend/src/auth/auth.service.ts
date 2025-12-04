import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LogsService } from '../logs/logs.service'; // ✨ 1. 引入 LogsService
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private logsService: LogsService, // ✨ 2. 注入 LogsService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    // ... (驗證邏輯保持不變，省略以節省篇幅) ...
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) return null;
    const isMatch = await bcrypt.compare(pass, user.password);
    if (isMatch) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  // ✨ 3. 修改 login 方法，接收 IP 和 UserAgent
  async login(user: any, ip: string = 'unknown', userAgent: string = 'unknown') {
    const payload = { email: user.email, sub: user.id, role: user.role };

    // ✨✨✨ 寫入登入日誌 ✨✨✨
    // 這裡使用非同步執行 (不 await)，避免拖慢登入回應速度
    this.logsService.logLogin(user, ip, userAgent).catch(err => console.error('Log failed', err));

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      // 確保 dealerProfile 存在
      dealerProfile: user.dealerProfile 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: safeUser,
    };
  }
}
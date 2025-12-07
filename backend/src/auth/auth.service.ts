import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LogsService } from '../logs/logs.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private logsService: LogsService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) return null;
    const isMatch = await bcrypt.compare(pass, user.password);
    if (isMatch) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, ip: string = 'unknown', userAgent: string = 'unknown') {
    const payload = { email: user.email, sub: user.id, role: user.role };
    this.logsService.logLogin(user, ip, userAgent).catch(err => console.error('Log failed', err));

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      dealerProfile: user.dealerProfile 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: safeUser,
    };
  }

  // ✨✨✨ 1. 申請重設密碼 ✨✨✨
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // 為了安全，即使 Email 不存在也不要報錯，以免被暴力枚舉帳號
      // 但為了開發方便，我們還是 log 一下
      console.log(`[Auth] 嘗試重設不存在的 Email: ${email}`);
      return { message: '若 Email 存在，重設信件已發送' };
    }

    // 產生重設專用 Token (效期 1 小時)
    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'reset_password' }, 
      { expiresIn: '1h' }
    );

    // 產生前端重設連結 (假設前端在 localhost:3000)
    // 上線時請改為真實網域
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    // 模擬發信 (在終端機顯示)
    console.log('=================================================');
    console.log('🔑 [模擬郵件主機] 重設密碼信件已攔截');
    console.log(`收件人: ${email}`);
    console.log(`重設連結: ${resetLink}`);
    console.log('=================================================');

    return { message: '重設信件已發送' };
  }

  // ✨✨✨ 2. 執行重設密碼 ✨✨✨
  async resetPassword(token: string, newPassword: string) {
    try {
      // 驗證 Token
      const payload = this.jwtService.verify(token);
      
      if (payload.type !== 'reset_password') {
        throw new BadRequestException('無效的重設憑證');
      }

      const userId = payload.sub;
      
      // 更新密碼 (利用 UsersService 現有的 updateProfile 功能)
      await this.usersService.updateProfile(userId, { password: newPassword });

      return { message: '密碼重設成功，請重新登入' };

    } catch (error) {
      console.error(error);
      throw new BadRequestException('重設連結已過期或無效');
    }
  }
}
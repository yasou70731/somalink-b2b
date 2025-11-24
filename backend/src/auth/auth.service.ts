import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    console.log(`[AuthDebug] 正在嘗試登入 Email: ${email}`);
    
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      console.log(`[AuthDebug] ❌ 找不到使用者 (User Not Found)`);
      return null;
    }

    console.log(`[AuthDebug] ✅ 找到使用者 ID: ${user.id}, 角色: ${user.role}, IsActive: ${user.isActive}`);
    
    if (!user.password) {
      console.log(`[AuthDebug] ❌ 資料庫中的密碼欄位是空的`);
      return null;
    }

    if (!pass) {
      console.log(`[AuthDebug] ❌ 介面沒有傳送密碼過來 (輸入 密碼 為 空)`);
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    console.log(`[AuthDebug] 🔐 密碼比對結果: ${isMatch ? '成功 (Match)' : '失敗 (Mismatch)'}`);

    if (isMatch) {
      // 這裡會把密碼拿掉，只回傳安全資料
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  // ✨ Fix: 修改這裡，直接接收已經驗證過的 user 物件
  async login(user: any) {
    // 🛑 刪除這段：不要再驗證一次，因為 user 物件裡已經沒有原始密碼了，再驗證會失敗
    // const validatedUser = await this.validateUser(...)
    
    // 直接發放 Token
    const payload = { email: user.email, sub: user.id, role: user.role };

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: safeUser,
    };
  }
}
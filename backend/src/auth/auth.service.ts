import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { AuthPayloadDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    console.log(`[AuthDebug] 正在嘗試登入 Email: ${email}`);
    
    // 1. 找使用者
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      console.log(`[AuthDebug] ❌ 找不到使用者 (User Not Found)`);
      return null;
    }

    console.log(`[AuthDebug] ✅ 找到使用者 ID: ${user.id}, Role: ${user.role}, IsActive: ${user.isActive}`);
    
    // 2. 檢查密碼欄位是否存在
    if (!user.password) {
      console.log(`[AuthDebug] ❌ 資料庫中的密碼欄位是空的 (Password is null/empty)`);
      return null;
    }

    if (!pass) {
      console.log(`[AuthDebug] ❌ 前端沒有傳送密碼過來 (Input password is empty)`);
      return null;
    }

    // 3. 比對密碼
    const isMatch = await bcrypt.compare(pass, user.password);
    console.log(`[AuthDebug] 🔐 密碼比對結果: ${isMatch ? '成功 (Match)' : '失敗 (Mismatch)'}`);

    if (isMatch) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(authPayloadDto: AuthPayloadDto) {
    // 呼叫上面的 validateUser
    const user = await this.validateUser(authPayloadDto.email, authPayloadDto.password);
    
    if (!user) {
      // 這裡丟出的 401 就是您在前端看到的錯誤
      throw new UnauthorizedException('帳號或密碼錯誤 (驗證流程失敗)');
    }
    
    const payload = { email: user.email, sub: user.id, role: user.role };

    // 手動挑選回傳欄位，避免循環參照 (Circular JSON)
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
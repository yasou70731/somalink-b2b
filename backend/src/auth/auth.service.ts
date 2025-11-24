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
    const user = await this.usersService.findByEmail(email);
    
    // ✨ Fix: 多加了 (user.password && pass) 的檢查
    // 如果使用者不存在，或資料庫沒密碼，或沒輸入密碼，就直接跳過比對，避免報錯
    if (user && user.password && pass && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(authPayloadDto: AuthPayloadDto) {
    const user = await this.validateUser(authPayloadDto.email, authPayloadDto.password);
    if (!user) {
      throw new UnauthorizedException('帳號或密碼錯誤 (或帳號資料異常)');
    }
    
    const payload = { email: user.email, sub: user.id, role: user.role };

    // ✨ Fix: 手動挑選回傳欄位，避免循環參照導致 500 錯誤
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
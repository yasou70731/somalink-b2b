import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common'; // ✨ 引入 ForbiddenException
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
    const user = await this.usersService.findOneByEmail(email);
    
    if (user && user.password) {
      if (user.password === pass) {
        
        // ✨ 關鍵檢查：如果帳號未啟用，拋出錯誤
        if (!user.isActive) {
          throw new ForbiddenException('帳號審核中，請聯繫管理員開通');
        }

        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }
}
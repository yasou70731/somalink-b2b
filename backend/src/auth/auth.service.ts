import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service'; // 我們需要呼叫 User 模組來查帳號
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 1. 驗證使用者身分 (Login 用的)
  async validateUser(email: string, pass: string): Promise<any> {
    // 從資料庫找這個人
    // 注意：我們稍後要在 UsersService 補上 findOneByEmail 方法
    const user = await this.usersService.findOneByEmail(email);
    
    if (user && user.password) {
      // 比對密碼 (這裡先簡單比對，正式環境要用 bcrypt.compare)
      // 目前假設資料庫存的是明碼 (為了測試方便)，之後再改加密
      if (user.password === pass) {
        const { password, ...result } = user;
        return result; // 密碼對了，回傳使用者資料(不含密碼)
      }
    }
    return null;
  }

  // 2. 產生 JWT Token
  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: user, //順便回傳使用者資料給前台存
    };
  }
}
import { Controller, Post, Body, UnauthorizedException, Req, Ip } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any, @Req() req: any, @Ip() ip: string) {
    // 1. 驗證帳號密碼
    const user = await this.authService.validateUser(body.email, body.password);
    
    if (!user) {
      throw new UnauthorizedException('帳號或密碼錯誤');
    }

    // 2. 取得客戶端資訊 (IP & User Agent)
    // 如果有經過反向代理 (如 Render/Vercel)，真實 IP 通常在 x-forwarded-for
    const realIp = req.headers['x-forwarded-for'] || ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';

    // 3. 發放 Token 並記錄日誌
    return this.authService.login(user, realIp, userAgent);
  }

  // ✨✨✨ 新增：忘記密碼請求 ✨✨✨
  // 前端呼叫此 API 來申請重設信件
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  // ✨✨✨ 新增：執行重設密碼 ✨✨✨
  // 前端在重設頁面輸入新密碼後，呼叫此 API (需帶入網址上的 token)
  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }
}
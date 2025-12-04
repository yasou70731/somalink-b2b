import { Controller, Post, Body, UnauthorizedException, Req, Ip } from '@nestjs/common'; // ✨ 引入 Req, Ip
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  // ✨ 注入 Request 物件以取得 IP 和 User-Agent
  async login(@Body() body: any, @Req() req: any, @Ip() ip: string) {
    // 1. 驗證帳號密碼
    const user = await this.authService.validateUser(body.email, body.password);
    
    if (!user) {
      throw new UnauthorizedException('帳號或密碼錯誤');
    }

    // 2. 取得客戶端資訊
    // 如果有經過反向代理 (如 Render/Vercel/Nginx)，真實 IP 通常在 x-forwarded-for
    const realIp = req.headers['x-forwarded-for'] || ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';

    // 3. 發放 Token 並記錄日誌
    return this.authService.login(user, realIp, userAgent);
  }
}
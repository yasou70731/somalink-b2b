import { Controller, Get, Patch, Body } from '@nestjs/common';
import { SiteConfigService } from './site-config.service';

@Controller('site-config')
export class SiteConfigController {
  constructor(private readonly service: SiteConfigService) {}

  // --- 首頁配置 ---
  @Get('homepage')
  getHomepage() {
    return this.service.getHomepageConfig();
  }

  @Patch('homepage')
  updateHomepage(@Body() body: any) {
    return this.service.updateHomepageConfig(body);
  }

  // --- ✨✨✨ 新增：系統規則接口 (解決 404 錯誤) ✨✨✨ ---
  @Get('rules')
  getSystemRules() {
    return this.service.getSystemRules();
  }

  @Patch('rules')
  updateSystemRules(@Body() body: any) {
    return this.service.updateSystemRules(body); // 注意：前端傳來的 body 應該是 settings 物件
  }
}
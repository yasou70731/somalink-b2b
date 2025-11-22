import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';

@Controller('announcements')
export class AnnouncementsController { // ✨ 確認這裡有 export
  constructor(private readonly service: AnnouncementsService) {}

  // 1. 前台抓取最新公告
  @Get('active')
  findActive() {
    return this.service.findActive();
  }

  // 2. 後台列表
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // 3. 新增
  @Post()
  create(@Body() body: { content: string }) {
    return this.service.create(body.content);
  }

  // 4. 切換狀態
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.service.toggle(id, body.isActive);
  }

  // 5. 刪除
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
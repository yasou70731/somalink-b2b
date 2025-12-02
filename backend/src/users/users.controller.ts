import { Controller, Get, Post, Patch, Delete, Body, Param, HttpException, HttpStatus, Query, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // 記得引入 Guard

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ... (Create, FindAll 保持原樣) ...
  @Post()
  create(@Body() createUserDto: any) { return this.usersService.create(createUserDto); }

  @Get()
  findAll() { return this.usersService.findAll(); }

  // ✨✨✨ 新增：取得當前使用者資料 ✨✨✨
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  // ✨✨✨ 新增：更新當前使用者資料 ✨✨✨
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req, @Body() body: any) {
    try {
      // 強制使用 Token 裡的 ID，防止修改他人資料
      return await this.usersService.updateProfile(req.user.id, body);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ... (其他管理員用的 API 保持原樣：status, level, deposit, make-admin, remove) ...
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) { return this.usersService.toggleActive(id, body.isActive); }

  @Patch(':id/level')
  async updateLevel(@Param('id') id: string, @Body() body: { level: any }) { return this.usersService.updateLevel(id, body.level); }

  @Post(':id/deposit')
  async deposit(@Param('id') id: string, @Body() body: { amount: number }) { return this.usersService.deposit(id, body.amount); }

  @Get('make-admin')
  async makeAdmin(@Query('email') email: string) { return this.usersService.makeAdmin(email); }

  @Delete(':id')
  async remove(@Param('id') id: string) { return this.usersService.remove(id); }
}
import { Controller, Get, Post, Patch, Delete, Body, Param, HttpException, HttpStatus, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. 註冊新帳號
  @Post()
  create(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  // 2. 查詢所有帳號 (後台列表用)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // 3. 切換啟用狀態 API (PATCH /users/:id/status) - 用於審核開通
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.usersService.toggleActive(id, body.isActive);
  }

  // 4. 修改等級 API (PATCH /users/:id/level)
  @Patch(':id/level')
  async updateLevel(@Param('id') id: string, @Body() body: { level: any }) {
    try {
      return await this.usersService.updateLevel(id, body.level);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // 5. 儲值 API (POST /users/:id/deposit)
  @Post(':id/deposit')
  async deposit(@Param('id') id: string, @Body() body: { amount: number }) {
    try {
      return await this.usersService.deposit(id, body.amount);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // 6. 秘密通道：升級管理員 (GET /users/make-admin?email=xxx)
  @Get('make-admin')
  async makeAdmin(@Query('email') email: string) {
    try {
      const user = await this.usersService.makeAdmin(email);
      return { message: `成功！帳號 ${user.email} 已升級為超級管理員 (Admin)。`, user };
    } catch (error: any) {
      return { message: '失敗', error: error.message };
    }
  }

  // ✨ 7. 刪除使用者 API (DELETE /users/:id)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.usersService.remove(id);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
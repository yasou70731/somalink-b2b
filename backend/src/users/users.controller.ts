import { Controller, Get, Post, Body, Param, HttpException, HttpStatus, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post(':id/deposit')
  async deposit(@Param('id') id: string, @Body() body: { amount: number }) {
    try {
      return await this.usersService.deposit(id, body.amount);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ✨ 秘密通道：透過網址直接升級管理員
  // 使用方式: http://localhost:4000/users/make-admin?email=您的Email
  @Get('make-admin')
  async makeAdmin(@Query('email') email: string) {
    try {
      const user = await this.usersService.makeAdmin(email);
      return { message: `成功！帳號 ${user.email} 已升級為超級管理員 (Admin)。`, user };
    } catch (error: any) {
      return { message: '失敗', error: error.message };
    }
  }
}
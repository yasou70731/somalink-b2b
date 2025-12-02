import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/entities/user.entity'; // ✨ 記得引入 UserRole

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 1. 建立訂單
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    return this.ordersService.create(createOrderDto, req.user);
  }

  // ✨ 2. 查詢訂單列表 (修正權限邏輯)
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req) {
    // 判斷角色：如果是管理員，就呼叫 findAll (查全部)
    // 兼容大小寫 (ADMIN 或 admin)
    if (req.user.role === UserRole.ADMIN || req.user.role === 'admin' || req.user.role === 'ADMIN') {
      return this.ordersService.findAll();
    }
    // 如果是經銷商，只查自己的
    return this.ordersService.findAllByUser(req.user);
  }

  // 避免 /orders/all 被當成 id
  @Get('all')
  @UseGuards(JwtAuthGuard)
  findAllAlias(@Request() req) {
    if (req.user.role === UserRole.ADMIN || req.user.role === 'admin') {
      return this.ordersService.findAll();
    }
    return this.ordersService.findAllByUser(req.user);
  }

  // 3. 查詢單一訂單
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // 4. 更新訂單狀態
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.updateStatus(id, updateOrderDto.status, updateOrderDto.adminNote);
  }

  // 5. 刪除訂單
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.ordersService.remove(id, req.user);
  }
}
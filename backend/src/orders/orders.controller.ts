import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 1. 建立訂單
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    return this.ordersService.create(createOrderDto, req.user);
  }

  // 2. 查詢訂單列表 (GET /orders)
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req) {
    return this.ordersService.findAllByUser(req.user);
  }

  // ✨ Fix: 新增這個路由來攔截 "/orders/all"，防止它掉進 ":id" 導致 UUID 錯誤
  // 必須放在 @Get(':id') 之前！
  @Get('all')
  @UseGuards(JwtAuthGuard)
  findAllAlias(@Request() req) {
    return this.ordersService.findAllByUser(req.user);
  }

  // 3. 查詢單一訂單
  @Get(':id')
  @UseGuards(JwtAuthGuard) // 建議加上驗證
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // 4. 更新訂單狀態/備註
  @Patch(':id')
  @UseGuards(JwtAuthGuard) // 建議加上驗證
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
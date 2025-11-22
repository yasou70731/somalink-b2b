import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 1. 管理員查全部 (GET /orders/all)
  // 注意：這裡目前是公開的，正式上線建議加上 AdminGuard
  @Get('all')
  findAllOrders() {
    return this.ordersService.findAll();
  }

  // ✨ 2. 查單一訂單 (GET /orders/:id) - 這是這次補上的！
  // 因為這行路徑是變數 :id，所以要放在固定的路徑 (如 'all') 後面，以免衝突
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // 3. 經銷商查自己 (GET /orders) - 需要登入
  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Request() req) {
    return this.ordersService.findAllByUser(req.user);
  }

  // 4. 下單 (POST /orders) - 需要登入
  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() createOrderDto: any, @Request() req) {
    return this.ordersService.create(createOrderDto, req.user);
  }

  // 5. 修改狀態/審核 (PATCH /orders/:id/status)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: any) {
    return this.ordersService.updateStatus(id, body.status, body.adminNote);
  }
}
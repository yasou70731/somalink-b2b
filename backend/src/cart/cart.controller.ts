import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard) // 保護路由：只有登入的使用者才能存取購物車
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // 取得目前使用者的購物車內容
  @Get()
  getCart(@Request() req) {
    return this.cartService.getCart(req.user);
  }

  // 加入商品到購物車
  @Post()
  addToCart(@Request() req, @Body() body: any) {
    return this.cartService.addToCart(req.user, body);
  }

  // 移除單一購物車項目
  @Delete(':id')
  removeItem(@Request() req, @Param('id') id: string) {
    return this.cartService.removeItem(req.user, id);
  }

  // 清空整台購物車
  @Delete()
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user);
  }
}
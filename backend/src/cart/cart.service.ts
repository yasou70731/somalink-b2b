import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private cartRepository: Repository<CartItem>,
  ) {}

  // 取得使用者的購物車
  async getCart(user: User) {
    return this.cartRepository.find({
      where: { user: { id: user.id } },
      relations: ['product'], // 關聯產品資訊，以便前端顯示圖片與名稱
      order: { createdAt: 'DESC' }
    });
  }

  // 加入購物車
  async addToCart(user: User, itemDto: any) {
    // 建立 CartItem 實體，並填入所有詳細規格
    // 這裡不進行合併邏輯(Merge)，因為客製化規格太複雜，視為新的一筆
    const cartItem = this.cartRepository.create({
      user: user,
      product: { id: itemDto.productId },
      
      // 規格資料 (直接從前端 DTO 映射)
      serviceType: itemDto.serviceType,
      widthMatrix: itemDto.widthMatrix,
      heightData: itemDto.heightData,
      isCeilingMounted: itemDto.isCeilingMounted,
      siteConditions: itemDto.siteConditions,
      colorName: itemDto.colorName,
      materialName: itemDto.materialName,
      handleName: itemDto.handleName,
      openingDirection: itemDto.openingDirection,
      hasThreshold: itemDto.hasThreshold,
      
      // 數量與金額
      quantity: itemDto.quantity,
      subtotal: itemDto.subtotal,
      
      // 價格快照 (重要：保留當下計算的價格細節)
      priceSnapshot: itemDto.priceSnapshot
    });

    return this.cartRepository.save(cartItem);
  }

  // 移除單一項目
  async removeItem(user: User, id: string) {
    // 確保只能刪除自己的購物車項目
    const item = await this.cartRepository.findOne({ 
      where: { id, user: { id: user.id } } 
    });
    
    if (!item) {
      throw new NotFoundException('找不到該項目或無權限刪除');
    }
    
    return this.cartRepository.remove(item);
  }

  // 清空購物車 (結帳後使用)
  async clearCart(user: User) {
    const items = await this.cartRepository.find({ 
      where: { user: { id: user.id } } 
    });
    
    if (items.length > 0) {
      return this.cartRepository.remove(items);
    }
    
    return { message: 'Cart is already empty' };
  }
}
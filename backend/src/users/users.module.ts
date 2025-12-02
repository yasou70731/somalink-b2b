import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TradeCategoriesController } from './trade-categories.controller'; 
import { User } from './entities/user.entity';
import { DealerProfile } from './entities/dealer-profile.entity';
import { TradeCategory } from './entities/trade-category.entity';
import { NotificationsModule } from '../notifications/notifications.module';
// ✨ 修正：路徑改為 ../cart (原本是 ../../cart)
import { CartItem } from '../cart/entities/cart-item.entity';

@Module({
  imports: [
    // 將 CartItem 加入 forFeature
    TypeOrmModule.forFeature([User, DealerProfile, TradeCategory, CartItem]),
    NotificationsModule,
  ],
  controllers: [
    UsersController, 
    TradeCategoriesController 
  ],
  providers: [UsersService],
  exports: [UsersService], 
})
export class UsersModule {}
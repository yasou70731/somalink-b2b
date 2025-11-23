import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity'; // ✨ 1. 引入 OrderItem
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    // ✨ 2. 加入 OrderItem 到這裡
    TypeOrmModule.forFeature([Order, OrderItem, User]), 
    NotificationsModule
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService], // 如果其他模組需要用
})
export class OrdersModule {}
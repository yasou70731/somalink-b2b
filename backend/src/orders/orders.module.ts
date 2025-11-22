import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module'; // 引入

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, User]),
    NotificationsModule, // ✨ 確認這裡有加進來
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
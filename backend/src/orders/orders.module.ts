import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
// ✨✨✨ 引入 SiteConfigModule ✨✨✨
import { SiteConfigModule } from '../site-config/site-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, User]), 
    NotificationsModule,
    // ✨✨✨ 註冊 ✨✨✨
    SiteConfigModule
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService], 
})
export class OrdersModule {}
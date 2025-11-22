import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Order } from '../orders/entities/order.entity'; // 引入 Order

@Module({
  imports: [TypeOrmModule.forFeature([Order])], // 記得註冊 Order 實體
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
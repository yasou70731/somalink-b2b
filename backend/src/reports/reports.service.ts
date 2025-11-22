import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
  ) {}

  async getDashboardStats() {
    // 1. 總營收 (排除已取消)
    const revenueResult = await this.ordersRepo.createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'sum')
      .where('order.status != :status', { status: 'cancelled' })
      .getRawOne();
    const totalRevenue = Number(revenueResult.sum || 0);

    // 2. 訂單總數
    const totalOrders = await this.ordersRepo.count();

    // 3. 依狀態分佈 (Pie Chart)
    const statusDist = await this.ordersRepo.createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .groupBy('order.status')
      .getRawMany();

    // 4. 最近 6 個月營收趨勢 (Bar Chart) - 簡易版：取所有訂單後端整理 (MVP寫法)
    // (若資料量大建議用 SQL Group By Date，這裡為了跨資料庫相容性先用 JS 處理)
    const allOrders = await this.ordersRepo.find({ 
      where: {  }, 
      select: ['totalAmount', 'createdAt', 'status'],
      order: { createdAt: 'ASC' }
    });

    const monthlyStats: any = {};
    allOrders.forEach(o => {
      if (o.status === 'cancelled') return;
      const month = new Date(o.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyStats[month]) monthlyStats[month] = 0;
      monthlyStats[month] += Number(o.totalAmount);
    });

    // 轉成陣列格式給前端圖表用
    const trendData = Object.keys(monthlyStats).map(month => ({
      name: month,
      total: monthlyStats[month]
    })).slice(-6); // 只取最近 6 個月

    return {
      totalRevenue,
      totalOrders,
      statusDist,
      trendData,
    };
  }
}
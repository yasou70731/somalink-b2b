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

    // 4. 最近 6 個月營收趨勢 (Bar Chart)
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

    const trendData = Object.keys(monthlyStats).map(month => ({
      name: month,
      total: monthlyStats[month]
    })).slice(-6); 

    // ✨ 5. 新增：熱銷產品排行 (Top 5 Products)
    // 統計產品名稱出現的次數
    // 注意：這裡需要關聯 product 才能抓到名稱，但我們的 Order 已經有 product 關聯
    const productStats = await this.ordersRepo.createQueryBuilder('order')
      .leftJoinAndSelect('order.product', 'product')
      .select('product.name', 'name')
      .addSelect('COUNT(order.id)', 'count')
      .addSelect('SUM(order.totalAmount)', 'revenue') // 順便算該產品的總營收
      .where('order.status != :status', { status: 'cancelled' })
      .groupBy('product.name')
      .orderBy('count', 'DESC')
      .limit(5) // 取前 5 名
      .getRawMany();

    // ✨ 6. 新增：熱銷顏色排行 (Top 5 Colors)
    const colorStats = await this.ordersRepo.createQueryBuilder('order')
      .select('order.colorName', 'name')
      .addSelect('COUNT(order.id)', 'count')
      .where('order.status != :status', { status: 'cancelled' })
      .groupBy('order.colorName')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      totalRevenue,
      totalOrders,
      statusDist,
      trendData,
      productStats, // 回傳產品排行
      colorStats,   // 回傳顏色排行
    };
  }
}
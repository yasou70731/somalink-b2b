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

    // ✨ 5. 修正：熱銷產品排行 (透過 OrderItem 關聯查詢)
    const productStats = await this.ordersRepo.createQueryBuilder('order')
      .leftJoin('order.items', 'item')         // 先連到 items
      .leftJoin('item.product', 'product')     // 再從 item 連到 product
      .select('product.name', 'name')
      .addSelect('SUM(item.quantity)', 'count') // 改為統計銷售數量
      .addSelect('SUM(item.subtotal)', 'revenue') 
      .where('order.status != :status', { status: 'cancelled' })
      .groupBy('product.name')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    // ✨ 6. 修正：熱銷顏色排行 (透過 OrderItem 查詢)
    // 顏色資訊在 OrderItem 上 (item.colorName)
    const colorStats = await this.ordersRepo.createQueryBuilder('order')
      .leftJoin('order.items', 'item')         // 必須 Join items
      .select('item.colorName', 'name')        // 選取 item 的顏色
      .addSelect('SUM(item.quantity)', 'count') // 統計數量
      .where('order.status != :status', { status: 'cancelled' })
      .groupBy('item.colorName')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      totalRevenue,
      totalOrders,
      statusDist,
      trendData,
      productStats,
      colorStats,
    };
  }
}
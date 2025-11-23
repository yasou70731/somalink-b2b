import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity'; // 👈 記得引入
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  // 1. 查所有訂單 (管理員用)
  async findAll() {
    return this.ordersRepository.find({
      // ✨ 關聯改為 items 與 items.product
      relations: ['user', 'user.dealerProfile', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  // 2. 查自己的訂單 (經銷商用)
  async findAllByUser(user: User) {
    return this.ordersRepository.find({
      where: { user: { id: user.id } },
      relations: ['items', 'items.product'], // ✨ 修改關聯
      order: { createdAt: 'DESC' },
    });
  }

  // 3. 查單一訂單
  async findOne(id: string) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'user.dealerProfile', 'items', 'items.product'], // ✨ 修改關聯
    });
    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }
    return order;
  }

  // 4. 下單 (支援購物車多品項)
  async create(createOrderDto: CreateOrderDto, user: User) {
    const order = new Order();
    order.user = user;
    order.projectName = createOrderDto.projectName;
    order.agreedToDisclaimer = createOrderDto.agreedToDisclaimer;
    
    // 生成訂單編號
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    order.orderNumber = `ORD-${date}-${random}`;
    order.status = OrderStatus.PENDING;

    // ✨ 核心邏輯：轉換 DTO items 為 Entity items
    // 因為 Order Entity 設定了 cascade: true，我們只需將 items 陣列掛在 order 上即可
    order.items = createOrderDto.items.map(itemDto => {
      const item = new OrderItem();
      item.product = { id: itemDto.productId } as any; // 關聯產品 ID
      item.serviceType = itemDto.serviceType as any;
      item.widthMatrix = itemDto.widthMatrix;
      item.heightData = itemDto.heightData;
      item.isCeilingMounted = itemDto.isCeilingMounted;
      item.siteConditions = itemDto.siteConditions;
      item.colorName = itemDto.colorName;
      item.materialName = itemDto.materialName;
      item.openingDirection = itemDto.openingDirection;
      item.hasThreshold = itemDto.hasThreshold;
      item.quantity = itemDto.quantity;
      item.subtotal = itemDto.subtotal;
      item.priceSnapshot = itemDto.priceSnapshot;
      return item;
    });

    // ✨ 自動計算整張訂單總金額
    order.totalAmount = order.items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    // 一次儲存 (Order + OrderItems)
    const savedOrder = await this.ordersRepository.save(order);

    // 通知 (顯示第一項產品名稱 + 等...)
    const dealerName = user.dealerProfile?.companyName || user.email;
    const firstItemName = savedOrder.items[0]?.product?.name || '客製化門扇'; // 這裡可能需要 reload 才能拿到 product name，先做 fallback
    const itemCount = savedOrder.items.length;
    
    const msg = `🔥 新訂單通知 (共${itemCount}件)！\n單號：${savedOrder.orderNumber}\n客戶：${dealerName}\n內容：${firstItemName} 等...`;
    
    this.notificationsService.sendLineNotify(msg).catch(err => console.error('Line通知失敗', err));

    return savedOrder;
  }

  // 5. 更新狀態
  async updateStatus(id: string, status: OrderStatus, adminNote?: string) {
    await this.ordersRepository.update(id, { status, adminNote });
    
    // 重新抓取資料 (含 items)
    const updatedOrder = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product']
    });

    if (updatedOrder && status === OrderStatus.PROCESSING) {
      const emailSubject = `【SomaLink】訂單 ${updatedOrder.orderNumber} 已審核通過`;
      const emailBody = `您的訂單 (包含 ${updatedOrder.items.length} 個項目) 已通過審核，工廠將開始排程生產。`;
      this.notificationsService.sendEmail(updatedOrder.user.email, emailSubject, emailBody)
        .catch(err => console.error('Email通知失敗', err));
    }

    return updatedOrder;
  }
}
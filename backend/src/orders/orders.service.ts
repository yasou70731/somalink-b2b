import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

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
      relations: ['user', 'user.dealerProfile', 'product'],
      order: { createdAt: 'DESC' },
    });
  }

  // 2. 查自己的訂單 (經銷商用)
  async findAllByUser(user: User) {
    return this.ordersRepository.find({
      where: { user: { id: user.id } },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  // ✨ 3. 查單一訂單 (列印/詳情用) - 這是這次補上的關鍵！
  async findOne(id: string) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'user.dealerProfile', 'product'],
    });
    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }
    return order;
  }

  // 4. 下單
  async create(createOrderDto: any, user: User) {
    const order = new Order();
    order.user = user;
    order.product = { id: createOrderDto.productId } as any; 
    order.projectName = createOrderDto.projectName;
    order.serviceType = createOrderDto.serviceType;
    order.widthMatrix = createOrderDto.widthMatrix;
    order.heightData = createOrderDto.heightData;
    order.siteConditions = createOrderDto.siteConditions;
    order.colorName = createOrderDto.colorName;
    order.materialName = createOrderDto.materialName;
    order.openingDirection = createOrderDto.openingDirection;
    order.hasThreshold = createOrderDto.hasThreshold || false;
    order.agreedToDisclaimer = createOrderDto.agreedToDisclaimer;
    order.totalAmount = createOrderDto.totalPrice;
    order.priceSnapshot = {
      basePrice: 0, sizeSurcharge: 0, colorSurcharge: 0, 
      materialSurcharge: 0, assemblyFee: 0, thresholdFee: 0
    };
    
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    order.orderNumber = `ORD-${date}-${random}`;
    order.status = OrderStatus.PENDING; 

    const savedOrder = await this.ordersRepository.save(order);

    // 通知
    const dealerName = user.dealerProfile?.companyName || user.email;
    const msg = `🔥 新訂單通知！\n單號：${savedOrder.orderNumber}\n客戶：${dealerName}`;
    this.notificationsService.sendLineNotify(msg).catch(err => console.error('Line通知失敗', err));

    return savedOrder;
  }

  // 5. 更新狀態 (審核)
  async updateStatus(id: string, status: OrderStatus, adminNote?: string) {
    await this.ordersRepository.update(id, { status, adminNote });
    
    const updatedOrder = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'product']
    });

    if (updatedOrder && status === OrderStatus.PROCESSING) {
      const emailSubject = `【SomaLink】訂單 ${updatedOrder.orderNumber} 已審核通過`;
      const emailBody = `您的訂單 (${updatedOrder.product.name}) 已通過審核。`;
      this.notificationsService.sendEmail(updatedOrder.user.email, emailSubject, emailBody)
        .catch(err => console.error('Email通知失敗', err));
    }

    return updatedOrder;
  }
}
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SiteConfigService } from '../site-config/site-config.service'; 

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
    private siteConfigService: SiteConfigService, 
  ) {}

  // 1. 查詢所有訂單 (管理員用)
  async findAll() {
    return this.ordersRepository.find({
      relations: ['user', 'user.dealerProfile', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  // 2. 查詢特定使用者的訂單 (經銷商用)
  async findAllByUser(user: User) {
    return this.ordersRepository.find({
      where: { user: { id: user.id } },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  // 3. 查詢單一訂單
  async findOne(id: string) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'user.dealerProfile', 'items', 'items.product'],
    });
    if (!order) {
      throw new NotFoundException(`找不到訂單 #${id}`);
    }
    return order;
  }

  // 4. 建立訂單 (含月刷制流水號邏輯)
  async create(createOrderDto: CreateOrderDto, user: User) {
    const order = new Order();
    order.user = user;
    order.projectName = createOrderDto.projectName;
    
    // 收貨資訊
    order.shippingAddress = createOrderDto.shippingAddress || '';
    order.siteContactPerson = createOrderDto.siteContactPerson || '';
    order.siteContactPhone = createOrderDto.siteContactPhone || '';
    
    // 附件
    order.attachments = createOrderDto.attachments || [];

    order.agreedToDisclaimer = createOrderDto.agreedToDisclaimer;
    order.customerNote = createOrderDto.customerNote;
    
    // ✨✨✨ 流水號生成邏輯 (月刷制) ✨✨✨
    
    // 1. 讀取後台設定的「重置日」
    const rules = await this.siteConfigService.getSystemRules();
    const resetDay = rules.settings?.order_reset_day || 1; // 預設每月 1 號重置

    // 2. 計算當前所屬的週期 (Cycle)
    const today = new Date();
    let cycleYear = today.getFullYear();
    let cycleMonth = today.getMonth(); // 0-11 (注意：0是1月)

    // 如果今天還沒到重置日 (例如設定 25 號，今天是 20 號)，則歸屬到「上個月」的帳務週期
    if (today.getDate() < resetDay) {
      cycleMonth -= 1;
    }

    // 處理跨年 (例如 1月往前推變成去年的 12月)
    if (cycleMonth < 0) {
      cycleMonth = 11;
      cycleYear -= 1;
    }

    // 3. 生成前綴字串：ORD-YYYYMM- (例如 ORD-202511-)
    const dateStr = `${cycleYear}${String(cycleMonth + 1).padStart(2, '0')}`; 
    const prefix = `ORD-${dateStr}`;

    // 4. 找出該週期的最後一筆訂單，以決定序號
    const lastOrder = await this.ordersRepository.findOne({
      where: { orderNumber: Like(`${prefix}%`) }, 
      order: { orderNumber: 'DESC' },
    });

    let sequence = 1;
    if (lastOrder) {
      const parts = lastOrder.orderNumber.split('-');
      // 確保格式正確 (ORD-YYYYMM-XXX)
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        }
      }
    }

    // 補零 (001, 002...)
    const sequenceStr = sequence.toString().padStart(3, '0'); 
    order.orderNumber = `${prefix}-${sequenceStr}`;
    order.status = OrderStatus.PENDING;

    // 建立訂單項目
    order.items = createOrderDto.items.map(itemDto => {
      const item = new OrderItem();
      item.product = { id: itemDto.productId } as any; 
      item.serviceType = itemDto.serviceType as any; 
      item.widthMatrix = itemDto.widthMatrix;
      item.heightData = itemDto.heightData;
      item.isCeilingMounted = itemDto.isCeilingMounted;
      item.siteConditions = itemDto.siteConditions;
      item.colorName = itemDto.colorName;
      item.materialName = itemDto.materialName;
      // ✨✨✨ 寫入把手名稱 ✨✨✨
      item.handleName = itemDto.handleName || '';
      item.openingDirection = itemDto.openingDirection;
      item.hasThreshold = itemDto.hasThreshold;
      item.quantity = itemDto.quantity;
      item.subtotal = itemDto.subtotal;
      item.priceSnapshot = itemDto.priceSnapshot;
      return item;
    });

    // 計算總金額
    order.totalAmount = order.items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    const savedOrder = await this.ordersRepository.save(order);

    // 發送通知
    const dealerName = user.dealerProfile?.companyName || user.email;
    const firstItemName = savedOrder.items[0]?.product?.name || '客製化門扇'; 
    const itemCount = savedOrder.items.length;
    const attachmentHint = order.attachments.length > 0 ? ` (含 ${order.attachments.length} 個附件)` : '';
    
    try {
        const msg = `🔥 新訂單通知${attachmentHint}！\n單號：${savedOrder.orderNumber}\n客戶：${dealerName}\n地點：${order.shippingAddress}\n內容：${firstItemName} 等 ${itemCount} 件`;
        this.notificationsService.sendLineNotify(msg).catch(err => console.log('Line 通知略過'));
    } catch (e) {
        // 忽略通知錯誤
    }

    return savedOrder;
  }

  // 5. 更新狀態
  async updateStatus(id: string, status?: OrderStatus, adminNote?: string) {
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (adminNote !== undefined) updateData.adminNote = adminNote;

    if (Object.keys(updateData).length > 0) {
      await this.ordersRepository.update(id, updateData);
    }
    
    const updatedOrder = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product']
    });

    if (updatedOrder && status) {
        let subject = '';
        let body = '';

        if (status === OrderStatus.PROCESSING) {
            subject = `【SomaLink】訂單 ${updatedOrder.orderNumber} 已審核通過`;
            body = `您的訂單已通過審核，工廠將開始排程生產。`;
        } else if (status === OrderStatus.SHIPPED) {
            subject = `【SomaLink】訂單 ${updatedOrder.orderNumber} 已出貨`;
            body = `您的訂單已完成生產並安排出貨，請留意物流通知。`;
        } else if (status === OrderStatus.COMPLETED) {
             subject = `【SomaLink】訂單 ${updatedOrder.orderNumber} 已結案`;
             body = `感謝您的訂購，期待再次為您服務。`;
        }

        if (subject) {
            this.notificationsService.sendEmail(updatedOrder.user.email, subject, body)
                .catch(err => console.log('Email 通知略過'));
        }
    }

    return updatedOrder;
  }

  // 6. 刪除訂單
  async remove(id: string, user: User) {
    const order = await this.findOne(id);

    if (order.user.id !== user.id) {
      throw new ForbiddenException('您無權刪除此訂單');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new ForbiddenException('訂單已進入生產流程，無法刪除。請聯繫客服。');
    }

    return this.ordersRepository.remove(order);
  }
}
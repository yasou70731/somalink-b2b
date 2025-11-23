import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
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

  // 3. 查詢單一訂單 (詳情/列印用)
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

  // 4. 建立訂單 (支援購物車多品項 & 流水號)
  async create(createOrderDto: CreateOrderDto, user: User) {
    const order = new Order();
    order.user = user;
    order.projectName = createOrderDto.projectName;
    order.agreedToDisclaimer = createOrderDto.agreedToDisclaimer;
    
    // 儲存客戶備註
    order.customerNote = createOrderDto.customerNote;
    
    // 生成流水號訂單編號：ORD-YYYYMMDD-XXX
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // 例如: 20231124
    const prefix = `ORD-${dateStr}`;

    // 找出今天最後一筆訂單，以決定序號
    const lastOrder = await this.ordersRepository.findOne({
      where: { orderNumber: Like(`${prefix}-%`) },
      order: { orderNumber: 'DESC' },
    });

    let sequence = 1;
    if (lastOrder) {
      const parts = lastOrder.orderNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    const sequenceStr = sequence.toString().padStart(3, '0'); // 補零 (001, 002...)
    order.orderNumber = `${prefix}-${sequenceStr}`;
    order.status = OrderStatus.PENDING;

    // 建立訂單項目 (包含服務模式 serviceType)
    order.items = createOrderDto.items.map(itemDto => {
      const item = new OrderItem();
      item.product = { id: itemDto.productId } as any; // 關聯產品 ID
      item.serviceType = itemDto.serviceType as any; // 確保寫入服務模式 (material/assembled)
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

    // 自動計算整張訂單總金額
    order.totalAmount = order.items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    // 儲存訂單 (Cascade 會自動儲存 items)
    const savedOrder = await this.ordersRepository.save(order);

    // 發送 LINE 通知 (管理員/群組)
    const dealerName = user.dealerProfile?.companyName || user.email;
    const firstItemName = savedOrder.items[0]?.product?.name || '客製化門扇'; 
    const itemCount = savedOrder.items.length;
    const noteHint = order.customerNote ? ' (含備註)' : '';
    
    const msg = `🔥 新訂單通知${noteHint} (共${itemCount}件)！\n單號：${savedOrder.orderNumber}\n客戶：${dealerName}\n內容：${firstItemName} 等...`;
    
    this.notificationsService.sendLineNotify(msg).catch(err => console.error('Line 通知失敗', err));

    return savedOrder;
  }

  // 5. 更新狀態 (審核/修改備註/出貨)
  async updateStatus(id: string, status?: OrderStatus, adminNote?: string) {
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (adminNote !== undefined) updateData.adminNote = adminNote;

    // 如果有欄位需要更新，才執行 update
    if (Object.keys(updateData).length > 0) {
      await this.ordersRepository.update(id, updateData);
    }
    
    const updatedOrder = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product']
    });

    if (updatedOrder) {
        // 狀態變更通知邏輯
        if (status === OrderStatus.PROCESSING) {
            const emailSubject = `【SomaLink】訂單 ${updatedOrder.orderNumber} 已審核通過`;
            const emailBody = `您的訂單 (包含 ${updatedOrder.items.length} 個項目) 已通過審核，工廠將開始排程生產。`;
            this.notificationsService.sendEmail(updatedOrder.user.email, emailSubject, emailBody)
            .catch(err => console.error('Email 通知失敗', err));
        } else if (status === OrderStatus.SHIPPED) {
            // ✨ 新增：出貨通知
            const emailSubject = `【SomaLink】訂單 ${updatedOrder.orderNumber} 已出貨`;
            const emailBody = `您的訂單 (包含 ${updatedOrder.items.length} 個項目) 已完成生產並安排出貨，請留意物流通知。`;
            this.notificationsService.sendEmail(updatedOrder.user.email, emailSubject, emailBody)
            .catch(err => console.error('Email 通知失敗', err));
        }
    }

    return updatedOrder;
  }

  // 6. 刪除訂單 (客戶自行取消/刪除)
  async remove(id: string, user: User) {
    const order = await this.findOne(id);

    // 權限檢查：只能刪除自己的訂單
    if (order.user.id !== user.id) {
      throw new ForbiddenException('您無權刪除此訂單');
    }

    // 狀態檢查：只能刪除 Pending (待審核) 狀態的訂單
    if (order.status !== OrderStatus.PENDING) {
      throw new ForbiddenException('訂單已進入生產流程，無法刪除。請聯繫客服。');
    }

    // 執行刪除 (Cascade 會自動刪除關聯的 items)
    return this.ordersRepository.remove(order);
  }
}
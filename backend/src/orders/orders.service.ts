import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import { DealerProfile } from '../users/entities/dealer-profile.entity';
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
    private dataSource: DataSource, // ✨ 注入 DataSource 以使用 Transaction
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

  // 4. 建立訂單 (含扣款邏輯與月刷制流水號)
  async create(createOrderDto: CreateOrderDto, user: User) {
    // 0. 預先計算總金額
    const totalAmount = createOrderDto.items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    // ✨✨✨ 啟動資料庫事務 (Transaction) ✨✨✨
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 檢查餘額並扣款 (使用悲觀鎖防止並發問題)
      // 注意：必須使用 queryRunner.manager 來操作，才能在同一個事務中
      const dealerProfile = await queryRunner.manager.findOne(DealerProfile, {
        where: { user: { id: user.id } },
        lock: { mode: 'pessimistic_write' } // 鎖定這筆資料直到事務結束
      });

      if (!dealerProfile) {
        throw new BadRequestException('找不到經銷商資料，無法進行扣款');
      }

      const currentBalance = Number(dealerProfile.walletBalance);
      
      // 檢查餘額是否足夠
      if (currentBalance < totalAmount) {
        throw new BadRequestException(`餘額不足！(訂單金額 $${totalAmount.toLocaleString()}，目前餘額 $${currentBalance.toLocaleString()})`);
      }

      // 執行扣款
      dealerProfile.walletBalance = currentBalance - totalAmount;
      await queryRunner.manager.save(dealerProfile);

      // 2. 準備訂單物件
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
      order.totalAmount = totalAmount; // 寫入總金額
      
      // 3. 流水號生成邏輯 (月刷制)
      
      // 讀取後台設定的「重置日」
      const rules = await this.siteConfigService.getSystemRules();
      const resetDay = rules.settings?.order_reset_day || 1; // 預設每月 1 號重置

      // 計算當前所屬的週期 (Cycle)
      const today = new Date();
      let cycleYear = today.getFullYear();
      let cycleMonth = today.getMonth(); // 0-11

      // 如果今天還沒到重置日，則歸屬到「上個月」的帳務週期
      if (today.getDate() < resetDay) {
        cycleMonth -= 1;
      }

      // 處理跨年
      if (cycleMonth < 0) {
        cycleMonth = 11;
        cycleYear -= 1;
      }

      // 生成前綴字串：ORD-YYYYMM-
      const dateStr = `${cycleYear}${String(cycleMonth + 1).padStart(2, '0')}`; 
      const prefix = `ORD-${dateStr}`;

      // 找出該週期的最後一筆訂單 (使用 queryRunner 查詢以確保一致性)
      const lastOrder = await queryRunner.manager.findOne(Order, {
        where: { orderNumber: Like(`${prefix}%`) }, 
        order: { orderNumber: 'DESC' },
      });

      let sequence = 1;
      if (lastOrder) {
        const parts = lastOrder.orderNumber.split('-');
        if (parts.length === 3) {
          const lastSeq = parseInt(parts[2], 10);
          if (!isNaN(lastSeq)) {
            sequence = lastSeq + 1;
          }
        }
      }

      // 補零
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
        item.handleName = itemDto.handleName || '';
        item.openingDirection = itemDto.openingDirection;
        item.hasThreshold = itemDto.hasThreshold;
        item.quantity = itemDto.quantity;
        item.subtotal = itemDto.subtotal;
        item.priceSnapshot = itemDto.priceSnapshot;
        return item;
      });

      // 4. 儲存訂單 (使用 queryRunner)
      const savedOrder = await queryRunner.manager.save(order);

      // ✨✨✨ 提交事務 (確認扣款與訂單建立) ✨✨✨
      await queryRunner.commitTransaction();

      // 5. 發送通知 (成功後才發送)
      // 這裡使用 dealerProfile 的 companyName，因為它是最新的
      const dealerName = dealerProfile.companyName || user.email;
      const firstItemName = savedOrder.items[0]?.product?.name || '客製化門扇'; // 注意：這裡可能因為是新建的物件而拿不到 product name，除非前端有傳或重新查詢。暫時保留原樣。
      const itemCount = savedOrder.items.length;
      const attachmentHint = order.attachments.length > 0 ? ` (含 ${order.attachments.length} 個附件)` : '';
      
      try {
          const msg = `🔥 新訂單通知${attachmentHint}！\n單號：${savedOrder.orderNumber}\n客戶：${dealerName}\n地點：${order.shippingAddress}\n金額：$${totalAmount.toLocaleString()}\n內容：${firstItemName} 等 ${itemCount} 件`;
          this.notificationsService.sendLineNotify(msg).catch(err => console.log('Line 通知略過'));
      } catch (e) {
          // 忽略通知錯誤
      }

      return savedOrder;

    } catch (err) {
      // 發生錯誤 (如餘額不足)，回滾所有變更
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      // 釋放資源
      await queryRunner.release();
    }
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
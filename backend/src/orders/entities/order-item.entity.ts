import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

// 將原本在 Order 裡的 ServiceType 移到這裡，讓不同商品可以有不同服務模式 (選配)
export enum ServiceType {
  MATERIAL = 'material',   // 純材料
  ASSEMBLED = 'assembled', // 含代工
}

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- 🔗 關聯 ---
  
  // 屬於哪張訂單
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' }) 
  order: Order;

  // 屬於哪個產品原型
  @ManyToOne(() => Product, { eager: true })
  product: Product;

  // --- 📏 核心丈量數據 (從 Order 搬過來的) ---

  @Column({
    type: 'enum',
    enum: ServiceType,
    default: ServiceType.ASSEMBLED
  })
  serviceType: ServiceType;
  
  // 寬度矩陣
  @Column({ type: 'jsonb' })
  widthMatrix: { top: number; mid: number; bot: number };

  // 高度數據
  @Column({ type: 'jsonb' })
  heightData: any; 

  @Column({ default: true })
  isCeilingMounted: boolean; 

  // 環境誤差
  @Column({ type: 'jsonb', nullable: true })
  siteConditions: any;

  // --- 🎨 客製化規格 ---

  @Column()
  colorName: string;

  @Column()
  materialName: string;

  @Column()
  openingDirection: string;

  @Column({ default: false })
  hasThreshold: boolean;

  // --- 💰 該品項金額 ---

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number; // 單項總價 (單價 * 數量)

  // 價格明細快照 (針對這一個品項)
  @Column({ type: 'jsonb' })
  priceSnapshot: {
    basePrice: number;
    sizeSurcharge: number;
    colorSurcharge: number;
    materialSurcharge: number;
    assemblyFee: number;
    thresholdFee: number;
  };
}
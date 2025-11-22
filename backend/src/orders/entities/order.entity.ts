import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

export enum OrderStatus {
  PENDING = 'pending',       // 待審核 (初始狀態)
  PROCESSING = 'processing', // 審核通過/排程中
  COMPLETED = 'completed',   // 完成
  CANCELLED = 'cancelled',   // 取消/拒絕
}

export enum ServiceType {
  MATERIAL = 'material',   // 純材料
  ASSEMBLED = 'assembled', // 含代工
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 訂單編號 (e.g., ORD-20231120-X8Y2) - 可在 Service 層生成
  @Column({ unique: true })
  orderNumber: string;

  // --- 關聯 ---
  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => Product, { eager: true })
  product: Product;

  // --- 📝 訂單基本資訊 ---
  @Column()
  projectName: string; // 案場名稱/備註

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING, // 預設全部都要審核
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: ServiceType,
  })
  serviceType: ServiceType;

  // --- 📏 核心丈量數據 (JSON) ---
  
  // 寬度矩陣: { top: 100, mid: 100.5, bot: 100 }
  @Column({ type: 'jsonb' })
  widthMatrix: { top: number; mid: number; bot: number };

  // 高度數據: { left: 200, mid: 200, right: 200 } (封頂時) 或 { singleValue: 200 } (不封頂)
  @Column({ type: 'jsonb' })
  heightData: any; 

  @Column({ default: true })
  isCeilingMounted: boolean; // 是否封頂

  // 環境誤差 (選填): { floor: {...}, leftWall: {...}, rightWall: {...} }
  @Column({ type: 'jsonb', nullable: true })
  siteConditions: any;

  // --- 💰 金額與客製化 ---

  @Column()
  colorName: string; // 選了什麼顏色

  @Column()
  materialName: string; // 選了什麼玻璃/材質

  @Column()
  openingDirection: string; // 開門方向

  @Column({ default: false })
  hasThreshold: boolean; // 是否加購門檻

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number; // 訂單總金額 (快照)

  // 價格明細快照 (Snapshot) - 存當下的計算細節，避免以後價格變動
  @Column({ type: 'jsonb' })
  priceSnapshot: {
    basePrice: number;
    sizeSurcharge: number;
    colorSurcharge: number;
    materialSurcharge: number;
    assemblyFee: number;
    thresholdFee: number;
  };

  // --- 🛡️ 風控與責任 ---

  @Column({ default: false })
  agreedToDisclaimer: boolean; // 是否同意免責聲明

  @Column({ nullable: true })
  adminNote: string; // 管理員審核備註 (e.g., "已確認尺寸")

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
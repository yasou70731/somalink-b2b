import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity'; // 👈 引入 Item

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  // 👇 新增: 一張訂單對應多個品項 (原本的 Product 關聯已移至 OrderItem)
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  // --- 📝 訂單層級資訊 ---
  @Column()
  projectName: string; // 整個案場名稱

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  // 移除 ServiceType, WidthMatrix, HeightData 等欄位 (已搬家)

  // --- 💰 總金額 ---
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number; // 整張訂單的總加總 (Sum of items.subtotal)

  // --- 🛡️ 風控 ---
  @Column({ default: false })
  agreedToDisclaimer: boolean;

  @Column({ nullable: true })
  adminNote: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
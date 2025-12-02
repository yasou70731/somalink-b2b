import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',       
  PROCESSING = 'processing', 
  SHIPPED = 'shipped',       
  COMPLETED = 'completed',   
  CANCELLED = 'cancelled',   
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string;

  // ✨✨✨ 修改重點：加入 onDelete: 'CASCADE' ✨✨✨
  // 這行代碼的意思是：當關聯的 User 被刪除時，自動刪除這筆 Order
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  @Column()
  projectName: string;

  @Column({ nullable: true })
  shippingAddress: string;

  @Column({ nullable: true })
  siteContactPerson: string; 

  @Column({ nullable: true })
  siteContactPhone: string; 

  @Column({ type: 'jsonb', nullable: true })
  attachments: string[];

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ default: false })
  agreedToDisclaimer: boolean;

  @Column({ nullable: true })
  adminNote?: string;

  @Column({ nullable: true })
  customerNote?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
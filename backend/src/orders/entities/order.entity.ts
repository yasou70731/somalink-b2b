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

// ✨✨✨ 修正重點：明確指定表名為 'orders' (複數)，避開 SQL 保留字 'order' ✨✨✨
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string;

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
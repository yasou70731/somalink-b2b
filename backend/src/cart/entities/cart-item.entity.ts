import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

export enum ServiceType {
  MATERIAL = 'material',   
  ASSEMBLED = 'assembled', 
}

@Entity()
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 關聯到使用者 (這是關鍵，讓購物車跟著人走)
  // onDelete: 'CASCADE' 表示如果使用者被刪除，購物車也會一起刪除
  @ManyToOne(() => User, (user) => user.cartItems, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Product, { eager: true })
  product: Product;

  @Column({
    type: 'enum',
    enum: ServiceType,
    default: ServiceType.ASSEMBLED
  })
  serviceType: ServiceType;
  
  @Column({ type: 'jsonb' })
  widthMatrix: { top: number; mid: number; bot: number };

  @Column({ type: 'jsonb' })
  heightData: any; 

  @Column({ default: true })
  isCeilingMounted: boolean; 

  @Column({ type: 'jsonb', nullable: true })
  siteConditions: any;

  @Column()
  colorName: string;

  @Column()
  materialName: string;

  // 把手名稱 (新增欄位)
  @Column({ nullable: true })
  handleName: string;

  @Column()
  openingDirection: string;

  @Column({ default: false })
  hasThreshold: boolean;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  // 這裡儲存的是「加入購物車當下」的試算金額
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number; 

  // 詳細價格快照 (方便後續轉成訂單時直接使用)
  @Column({ type: 'jsonb' })
  priceSnapshot: {
    basePrice: number;
    sizeSurcharge: number;
    colorSurcharge: number;
    materialSurcharge: number;
    handleSurcharge: number;
    assemblyFee: number;
    thresholdFee: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
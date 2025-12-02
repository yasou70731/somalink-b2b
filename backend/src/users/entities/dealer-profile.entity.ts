import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

export enum DealerLevel {
  A = 'A',
  B = 'B',
  C = 'C',
}

export enum TradeType {
  DESIGN = 'design', 
  GLASS = 'glass',   
  WINDOW = 'window', 
  DECOR = 'decor',   
  OTHER = 'other',   
}

@Entity()
export class DealerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyName: string;

  @Column()
  taxId: string;

  @Column()
  contactPerson: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  // ✨✨✨ 修正：加入 nullable: true 解決資料庫衝突 ✨✨✨
  @Column({
    type: 'enum',
    enum: TradeType,
    default: TradeType.OTHER,
    nullable: true 
  })
  tradeType: TradeType;

  @Column({
    type: 'enum',
    enum: DealerLevel,
    default: DealerLevel.C,
  })
  level: DealerLevel;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  walletBalance: number;

  @Column({ default: false })
  isUpgradeable: boolean;

  @OneToOne(() => User, (user) => user.dealerProfile)
  user: User;
}
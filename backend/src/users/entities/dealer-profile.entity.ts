import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum DealerLevel {
  A = 'A',
  B = 'B',
  C = 'C',
}

// 我們保留 Enum 定義給程式碼參考用，但資料庫欄位改用 String
export enum TradeType {
  CONSTRUCTION = 'construction', 
  GLASS = 'glass',               
  SHOWER_DOOR = 'shower_door',   
  DESIGN = 'design',             
  ALUMINUM = 'aluminum',         
  OTHER = 'other',               
}

@Entity()
export class DealerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyName: string;

  @Column({ unique: true })
  taxId: string;

  @Column()
  address: string;

  @Column()
  contactPerson: string;

  @Column()
  phone: string;

  @Column({
    type: 'enum',
    enum: DealerLevel,
    default: DealerLevel.C,
  })
  level: DealerLevel;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  walletBalance: number;

  // ✨ 關鍵修正：拿掉 enum 限制，改為一般字串
  // 這樣才能支援您在後台動態新增的任何類別
  @Column({ default: 'other' }) 
  tradeType: string;

  @Column({ default: false })
  isUpgradeable: boolean;

  @OneToOne(() => User, (user) => user.dealerProfile)
  user: User;
}
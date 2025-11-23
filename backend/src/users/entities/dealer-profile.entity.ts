import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

// 將 DealerLevel 從 type 改為 enum，這樣可以作為值使用 (修復 TS2693)
export enum DealerLevel {
  A = 'A',
  B = 'B',
  C = 'C',
}

// 定義並導出 TradeType enum (修復 TS2305)
export enum TradeType {
  GLASS_SHOP = 'glass_shop',
  INTERIOR_DESIGN = 'interior_design',
  OTHER = 'other',
}

@Entity()
export class DealerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyName: string;

  @Column({ nullable: true })
  taxId: string; // 統編

  @Column()
  contactPerson: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column({
    type: 'enum',
    enum: DealerLevel,
    default: DealerLevel.C,
  })
  level: DealerLevel;

  // 用來記錄是否通過書面審核 (可選)
  @Column({ default: false })
  isVerified: boolean;

  // ✨ 新增以下欄位以修復 TS2339 錯誤：

  @Column({
    type: 'enum',
    enum: TradeType,
    nullable: true, // 如果一開始可能沒有設定，設為 true
  })
  tradeType: TradeType;

  @Column({ default: false })
  isUpgradeable: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  walletBalance: number;
}
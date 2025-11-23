import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

// Change DealerLevel from type to enum so it can be used as a value
export enum DealerLevel {
  A = 'A',
  B = 'B',
  C = 'C',
}

// Define TradeType enum
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

  // ✨ Added missing fields based on your errors:

  @Column({
    type: 'enum',
    enum: TradeType,
    nullable: true, // Set to true if it might not be set initially
  })
  tradeType: TradeType;

  @Column({ default: false })
  isUpgradeable: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  walletBalance: number;
}
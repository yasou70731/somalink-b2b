import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DealerProfile } from './dealer-profile.entity';
import { TradeCategory } from './trade-category.entity';

// 定義 UserRole Enum
export enum UserRole {
  ADMIN = 'ADMIN',
  DEALER = 'DEALER',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // 加密後的密碼

  // ✨ 修改：暫時允許 name 為空 (nullable: true)，解決部署時的舊資料衝突
  @Column({ nullable: true })
  name: string; 

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.DEALER,
  })
  role: UserRole;

  @Column({ default: false })
  isActive: boolean; // 是否已啟用 (需後台開通)

  // --- 關聯 ---

  @OneToOne(() => DealerProfile, { cascade: true, eager: true })
  @JoinColumn()
  dealerProfile: DealerProfile;

  @ManyToOne(() => TradeCategory, { eager: true, nullable: true })
  tradeCategory: TradeCategory | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DealerProfile } from './dealer-profile.entity';
import { TradeCategory } from './trade-category.entity';

// ✨ 關鍵修正：改成 export enum，讓它成為一個真實物件，解決 DTO 引用問題
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

  @Column()
  name: string; // 使用者名稱 (或聯絡人姓名)

  @Column({
    type: 'enum',
    enum: UserRole, // 使用 Enum
    default: UserRole.DEALER,
  })
  role: UserRole;

  @Column({ default: false })
  isActive: boolean; // 是否已啟用 (需後台開通)

  // --- 關聯 ---

  @OneToOne(() => DealerProfile, { cascade: true, eager: true })
  @JoinColumn()
  dealerProfile: DealerProfile;

  // ✨ 修正：允許為 null (TradeCategory | null)，避免註冊時若未選類別發生錯誤
  @ManyToOne(() => TradeCategory, { eager: true, nullable: true })
  tradeCategory: TradeCategory | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
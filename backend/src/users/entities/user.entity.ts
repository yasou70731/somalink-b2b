import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DealerProfile } from './dealer-profile.entity';
import { TradeCategory } from './trade-category.entity';

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
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.DEALER,
  })
  role: UserRole;

  @Column({ default: false })
  isActive: boolean;

  // --- 關聯 ---

  @OneToOne(() => DealerProfile, { cascade: true, eager: true })
  @JoinColumn()
  dealerProfile: DealerProfile;

  // ✨ 修正：允許為 null (TradeCategory | null)
  @ManyToOne(() => TradeCategory, { eager: true, nullable: true })
  tradeCategory: TradeCategory | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
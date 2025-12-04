import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DealerProfile } from './dealer-profile.entity';
import { TradeCategory } from './trade-category.entity';
import { CartItem } from '../../cart/entities/cart-item.entity';

export enum UserRole {
  // ✨✨✨ 修正：將值改為小寫，以符合資料庫現有的 user_role_enum 定義 ✨✨✨
  ADMIN = 'admin',
  DEALER = 'dealer',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.DEALER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => DealerProfile, (profile) => profile.user, { cascade: true, eager: true })
  @JoinColumn()
  dealerProfile: DealerProfile;

  @ManyToOne(() => TradeCategory, { nullable: true, eager: true })
  tradeCategory: TradeCategory;

  @OneToMany(() => CartItem, (cartItem) => cartItem.user)
  cartItems: CartItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
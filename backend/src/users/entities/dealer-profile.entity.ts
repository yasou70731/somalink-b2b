import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export type DealerLevel = 'A' | 'B' | 'C';

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
    enum: ['A', 'B', 'C'],
    default: 'C',
  })
  level: DealerLevel;

  // 用來記錄是否通過書面審核 (可選)
  // ✨ 補上此欄位以解決 UsersService 中的 TypeScript 錯誤
  @Column({ default: false })
  isVerified: boolean;
}
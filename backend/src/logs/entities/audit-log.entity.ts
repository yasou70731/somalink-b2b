import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user: User; // 操作者

  @Column()
  action: string; // e.g. 'UPDATE_PRODUCT', 'DELETE_ORDER'

  @Column()
  targetEntity: string; // e.g. 'Product', 'Order'

  @Column()
  targetId: string; // 被操作物件的 ID

  @Column({ type: 'jsonb', nullable: true })
  details: any; // 改了什麼 (舊值/新值，或備註)

  @CreateDateColumn()
  createdAt: Date;
}
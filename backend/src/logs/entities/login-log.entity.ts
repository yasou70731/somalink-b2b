import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class LoginLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 關聯到使用者
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ nullable: true })
  ip: string; // 登入來源 IP

  @Column({ nullable: true })
  userAgent: string; // 瀏覽器資訊 (Chrome/Safari...)

  @Column({ default: true })
  success: boolean; // 是否成功 (目前只記成功，未來可擴充記失敗)

  @CreateDateColumn()
  loginAt: Date;
}
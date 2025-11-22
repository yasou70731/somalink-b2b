import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string; // 公告內容

  @Column({ default: false })
  isActive: boolean; // 是否啟用 (顯示在前台)

  @CreateDateColumn()
  createdAt: Date;
}
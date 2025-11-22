import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Series {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // 識別名稱 (例如：極簡系列)，這會跟產品的 series 欄位對應

  @Column()
  displayName: string; // 前台顯示的標題 (例如：極簡細框系列)

  @Column()
  description: string; // 描述 (例如：Modern Slim)

  @Column()
  imageUrl: string; // 封面圖網址

  @Column({ type: 'int', default: 0 })
  priceStart: number; // 起始價格

  @Column({ default: true })
  isActive: boolean; // 是否顯示
}
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class TradeCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // 顯示名稱 (e.g. 專業玻璃行)

  @Column({ unique: true })
  code: string; // 代碼 (e.g. glass)

  @Column({ default: false })
  isUpgradeable: boolean; // 能否升級 B 級

  // ✨ 新增：該行業別的預設折數 (1.0 = 原價, 0.7 = 7折)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  discountRate: number;
}
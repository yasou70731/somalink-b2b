import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

// 定義積木的結構 (給 TypeScript 看的)
export interface SiteBlock {
  id: string;       // 唯一 ID (用來排序和刪除)
  type: 'HERO' | 'FEATURES' | 'PRODUCT_LIST' | 'TEXT_BANNER'; // 積木類型
  data: any;        // 積木內容 (每種積木不一樣)
}

@Entity()
export class SiteConfig {
  // 我們固定用 'homepage' 或 'system_rules' 當作 ID
  @PrimaryColumn()
  key: string;

  // 用於首頁積木
  @Column({ type: 'jsonb', nullable: true })
  blocks: SiteBlock[];

  // ✨✨✨ 關鍵修正：補上 settings 欄位 ✨✨✨
  // 這樣 Service 才能存取 system_rules 的設定值
  @Column({ type: 'jsonb', nullable: true })
  settings: any;

  @UpdateDateColumn()
  updatedAt: Date;
}
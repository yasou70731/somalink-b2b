import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// 定義顏色與材質的資料結構 (存成 JSON)
export class ProductOption {
  name: string;
  priceSurcharge: number; // 加價金額
}

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;  // 產品名稱 (e.g., 極簡細框拉門)

  @Column()
  sku: string;   // 型號 (e.g., SLIM-01)

  @Column()
  series: string; // 系列名稱 (e.g., 極簡系列)

  @Column({ nullable: true })
  imageUrl: string; // 產品封面圖 (Cloudinary URL)

  // --- 💰 核心計價設定 ---

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number; // 基礎價格 (標準尺寸內的錢)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  assemblyFee: number; // 代工費 (若是代工模式，前端會將此費用打包進總價顯示)

  // --- 📏 標準尺寸邏輯 ---

  @Column({ type: 'int', default: 90 })
  standardWidth: number;  // 標準寬 (e.g. 90cm)

  @Column({ type: 'int', default: 210 })
  standardHeight: number; // 標準高 (e.g. 210cm)

  @Column({ type: 'int', default: 0 })
  pricePerUnitWidth: number; // 寬度每超 10cm 加價多少

  @Column({ type: 'int', default: 0 })
  pricePerUnitHeight: number; // 高度每超 10cm 加價多少

  // --- 🎨 客製化選項 (JSON) ---
  
  // 存顏色列表：[{ name: "消光黑", priceSurcharge: 0 }, { name: "香檳金", priceSurcharge: 500 }]
  @Column({ type: 'jsonb', nullable: true })
  colors: ProductOption[];

  // 存材質列表：[{ name: "8mm清玻", priceSurcharge: 0 }, { name: "長虹玻璃", priceSurcharge: 1000 }]
  @Column({ type: 'jsonb', nullable: true })
  materials: ProductOption[];

  // 存開門方向：["左內開", "右內開", "左外開", "右外開"]
  @Column({ type: 'jsonb', nullable: true })
  openingOptions: string[];

  // --- ⚙️ 系統欄位 ---

  @Column({ default: true })
  isActive: boolean; // 是否上架中

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
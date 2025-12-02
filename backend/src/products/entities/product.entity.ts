import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export class ProductOption {
  name: string;
  priceSurcharge: number; 
}

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;  

  @Column()
  sku: string;   

  @Column()
  series: string; 

  @Column({ type: 'jsonb', nullable: true }) 
  images: string[]; 

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number; 

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  assemblyFee: number; 

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountA: number; 

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountB: number; 

  @Column({ type: 'int', default: 90 })
  standardWidth: number;  

  @Column({ type: 'int', default: 210 })
  standardHeight: number; 

  @Column({ type: 'int', default: 0 })
  pricePerUnitWidth: number; 

  @Column({ type: 'int', default: 0 })
  pricePerUnitHeight: number; 

  @Column({ default: true })
  requiresMeasurement: boolean; 
  
  @Column({ type: 'jsonb', nullable: true })
  colors: ProductOption[];

  @Column({ type: 'jsonb', nullable: true })
  materials: ProductOption[];

  // ✨✨✨ 新增：把手選項 ✨✨✨
  @Column({ type: 'jsonb', nullable: true })
  handles: ProductOption[];

  @Column({ type: 'jsonb', nullable: true })
  openingOptions: string[];

  @Column({ default: true })
  isActive: boolean; 

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
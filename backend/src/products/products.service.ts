import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  // 1. 建立產品
  create(createProductDto: any) {
    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }

  // 2. 查詢所有產品
  findAll() {
    return this.productsRepository.find({ order: { createdAt: 'DESC' } });
  }

  // 3. 查詢單一產品
  findOne(id: string) {
    return this.productsRepository.findOneBy({ id });
  }

  // ✨ 4. 更新產品 (修復 500 錯誤版)
  async update(id: string, updateProductDto: any) {
    // 🔍 除錯用：印出收到什麼資料
    console.log('👉 [Backend] 收到更新請求 ID:', id);
    console.log('📦 [Backend] 原始資料:', JSON.stringify(updateProductDto));

    // 🛑 強制移除不可更新的系統欄位 (由後端把關最安全)
    delete updateProductDto.id;
    delete updateProductDto.createdAt;
    delete updateProductDto.updatedAt;

    // 確保數值欄位真的是數字 (防止前端傳來字串導致資料庫報錯)
    if (updateProductDto.basePrice) updateProductDto.basePrice = Number(updateProductDto.basePrice);
    if (updateProductDto.standardWidth) updateProductDto.standardWidth = Number(updateProductDto.standardWidth);
    if (updateProductDto.standardHeight) updateProductDto.standardHeight = Number(updateProductDto.standardHeight);

    try {
      // 執行更新
      await this.productsRepository.update(id, updateProductDto);
      
      console.log('✅ [Backend] 更新成功');
      return this.productsRepository.findOneBy({ id });
    } catch (error) {
      console.error('❌ [Backend] 更新失敗 (SQL Error):', error);
      // 這裡不 throw，讓 Controller 捕捉或是回傳更具體的錯誤
      throw error;
    }
  }

  // 5. 刪除產品
  async remove(id: string) {
    await this.productsRepository.delete(id);
    return { deleted: true };
  }
}
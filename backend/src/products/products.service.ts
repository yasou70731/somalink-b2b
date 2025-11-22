import { Injectable } from '@nestjs/common';
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

  // ✨ 4. 更新產品
  async update(id: string, updateProductDto: any) {
    // 先更新資料
    await this.productsRepository.update(id, updateProductDto);
    // 再把更新後的資料抓出來回傳
    return this.productsRepository.findOneBy({ id });
  }

  // ✨ 5. 刪除產品
  async remove(id: string) {
    await this.productsRepository.delete(id);
    return { deleted: true };
  }
}
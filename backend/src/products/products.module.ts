import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';

@Module({
  imports: [
    // ✨ 關鍵修正：註冊 Product 實體，讓 TypeORM 認識它
    TypeOrmModule.forFeature([Product]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // 匯出 Service，以防之後 Order 需要查產品
})
export class ProductsModule {}
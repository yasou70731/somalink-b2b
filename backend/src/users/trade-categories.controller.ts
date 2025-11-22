import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TradeCategory } from './entities/trade-category.entity';

@Controller('trade-categories')
export class TradeCategoriesController {
  constructor(
    @InjectRepository(TradeCategory)
    private repo: Repository<TradeCategory>,
  ) {}

  @Get()
  findAll() {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  // 新增時接收 discountRate
  @Post()
  create(@Body() body: { name: string; code: string; isUpgradeable: boolean; discountRate: number }) {
    const category = this.repo.create({
      ...body,
      discountRate: body.discountRate || 1.0 // 預設原價
    });
    return this.repo.save(category);
  }

  // 修改時接收 discountRate
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { isUpgradeable?: boolean; discountRate?: number }) {
    await this.repo.update(id, body);
    return this.repo.findOneBy({ id });
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.repo.delete(id);
  }
}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Series } from './entities/series.entity';

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Series)
    private repo: Repository<Series>,
  ) {}

  create(data: any) {
    const series = this.repo.create(data);
    return this.repo.save(series);
  }

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findOne(id: string) {
    return this.repo.findOneBy({ id });
  }

  async update(id: string, data: any) {
    await this.repo.update(id, data);
    return this.repo.findOneBy({ id });
  }

  remove(id: string) {
    return this.repo.delete(id);
  }

  // 初始化預設系列 (懶人包)
  async initDefaults() {
    const count = await this.repo.count();
    if (count === 0) {
      const defaults = [
        { name: '極簡系列', displayName: '極簡細框系列', description: 'Modern Slim', priceStart: 5000, imageUrl: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800' },
        { name: '經典系列', displayName: '經典寬框系列', description: 'Classic Bold', priceStart: 4500, imageUrl: 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?auto=format&fit=crop&q=80&w=800' },
        { name: '淋浴系列', displayName: '淋浴拉門系列', description: 'Shower Doors', priceStart: 8000, imageUrl: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&q=80&w=800' },
        { name: '懸浮系列', displayName: '懸浮無軌系列', description: 'Magnetic Levitation', priceStart: 12000, imageUrl: 'https://images.unsplash.com/photo-1486946255434-2466348c2166?auto=format&fit=crop&q=80&w=800' },
      ];
      for (const s of defaults) await this.repo.save(this.repo.create(s));
    }
  }
}
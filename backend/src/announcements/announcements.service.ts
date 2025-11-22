import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private repo: Repository<Announcement>,
  ) {}

  // 1. 建立公告
  create(content: string) {
    const announcement = this.repo.create({ content, isActive: true }); // 預設啟用
    return this.repo.save(announcement);
  }

  // 2. 查詢所有 (後台用)
  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  // 3. 查詢「目前啟用」的公告 (前台用) - 只抓最新的一筆
  async findActive() {
    return this.repo.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  // 4. 切換狀態 (開/關)
  async toggle(id: string, isActive: boolean) {
    await this.repo.update(id, { isActive });
    return this.repo.findOneBy({ id });
  }

  // 5. 刪除
  remove(id: string) {
    return this.repo.delete(id);
  }
}
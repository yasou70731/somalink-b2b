import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeriesService } from './series.service';
import { SeriesController } from './series.controller';
import { Series } from './entities/series.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Series])],
  controllers: [SeriesController],
  providers: [SeriesService],
})
export class SeriesModule implements OnModuleInit {
  constructor(private readonly service: SeriesService) {}
  
  // ✨ 啟動時自動建立預設系列資料 (避免前台空空的)
  async onModuleInit() {
    await this.service.initDefaults();
  }
}
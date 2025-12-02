import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteConfigService } from './site-config.service';
import { SiteConfigController } from './site-config.controller';
import { SiteConfig } from './entities/site-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SiteConfig])],
  controllers: [SiteConfigController],
  providers: [SiteConfigService],
  exports: [SiteConfigService]
})
export class SiteConfigModule {}
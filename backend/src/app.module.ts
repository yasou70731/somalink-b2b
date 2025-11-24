import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { ReportsModule } from './reports/reports.module';
import { SeriesModule } from './series/series.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 讓環境變數全域可用
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, // 優先使用 DATABASE_URL
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true, // 注意：生產環境建議改為 false，但在開發初期設為 true 可自動建表
      ssl: {
        rejectUnauthorized: false, // 允許自我簽署憑證 (解決 Render/Neon SSL 問題)
      },
      // 如果上述 ssl 設定仍無效，有些驅動程式需要 extra 屬性：
      // extra: {
      //   ssl: {
      //     rejectUnauthorized: false,
      //   },
      // },
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    ReportsModule,
    SeriesModule,
    AnnouncementsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
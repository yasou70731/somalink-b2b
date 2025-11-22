import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module'; // 記得確認這裡有 OrdersModule
import { AuthModule } from './auth/auth.module';       // 記得確認這裡有 AuthModule
import { NotificationsModule } from './notifications/notifications.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { SeriesModule } from './series/series.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    // 1. 先讀取 .env 檔案 (一定要放第一個)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. 設定資料庫連線
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, 
      autoLoadEntities: true,
      synchronize: true,
      // ✨ 關鍵修正：Neon 必須開啟 SSL
      ssl: true,
      extra: {
        ssl: {
          rejectUnauthorized: false, // 允許連線到 Neon
        },
      },
    }),

    UsersModule,
    ProductsModule,
    OrdersModule,
    AuthModule,
    NotificationsModule,
    AnnouncementsModule,
    SeriesModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
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
// 引入網站設定模組 (首頁積木、系統規則)
import { SiteConfigModule } from './site-config/site-config.module';
// 引入購物車模組 (伺服器端購物車)
import { CartModule } from './cart/cart.module';

@Module({
  imports: [
    // 1. 全域環境變數設定 (.env)
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    
    // 2. 資料庫連線設定 (PostgreSQL)
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, // 優先使用 DATABASE_URL
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true, // 自動載入所有 Entity
      synchronize: true,      // 開發模式下自動同步資料庫結構 (生產環境建議改 false)
      ssl: {
        rejectUnauthorized: false, // 允許自我簽署憑證 (解決 Render/Neon SSL 問題)
      },
    }),

    // 3. 功能模組註冊
    UsersModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    ReportsModule,
    SeriesModule,
    AnnouncementsModule,
    NotificationsModule,
    SiteConfigModule,
    CartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 🔍 診斷監視器：印出目前讀到的資料庫網址 (只印前 20 個字，保護密碼)
  const dbUrl = process.env.DATABASE_URL;
  console.log('------------------------------------------------');
  console.log('🔍 診斷檢查中...');
  console.log('資料庫網址讀取狀態:', dbUrl ? '✅ 讀到了' : '❌ 是空的 (undefined)');
  if (dbUrl) {
    console.log('網址開頭:', dbUrl.substring(0, 25) + '...');
  }
  console.log('------------------------------------------------');

  app.enableCors();
  await app.listen(4000);
}
bootstrap();
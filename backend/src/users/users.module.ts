import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TradeCategoriesController } from './trade-categories.controller'; // ✨ 管理營業類別的控制器
import { User } from './entities/user.entity';
import { DealerProfile } from './entities/dealer-profile.entity';
import { TradeCategory } from './entities/trade-category.entity'; // ✨ 營業類別實體

@Module({
  imports: [
    // 註冊 User, DealerProfile 以及新的 TradeCategory 實體
    // 這樣 Service 才能對這些資料表進行操作 (InjectRepository)
    TypeOrmModule.forFeature([User, DealerProfile, TradeCategory]),
  ],
  controllers: [
    UsersController, 
    TradeCategoriesController // ✨ 記得註冊這個，後台設定頁才連得到 API
  ],
  providers: [UsersService],
  exports: [UsersService], // 匯出 Service 讓 Auth 模組驗證登入時可以使用
})
export class UsersModule {}
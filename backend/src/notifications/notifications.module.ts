import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Module({
  providers: [NotificationsService],
  // ✨ 關鍵修正：必須把 Service 匯出，別的模組才看得到！
  exports: [NotificationsService], 
})
export class NotificationsModule {}
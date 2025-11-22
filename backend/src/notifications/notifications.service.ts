import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  // 1. 寄送 Email (給經銷商)
  async sendEmail(to: string, subject: string, text: string) {
    // TODO: 階段二會在這裡填入真的 Gmail/Resend 設定
    // 目前先用 console.log 模擬
    console.log('=================================================');
    console.log('📧 [模擬寄信] 準備發送 Email...');
    console.log(`收件人: ${to}`);
    console.log(`主旨: ${subject}`);
    console.log(`內容: ${text}`);
    console.log('=================================================');
    
    // 假裝發送成功
    return true;
  }

  // 2. 發送 Line Notify (給工廠管理員)
  async sendLineNotify(message: string) {
    // TODO: 階段二會在這裡填入 Line Token
    // 目前先用 console.log 模擬
    console.log('=================================================');
    console.log('🔔 [模擬 Line] 準備發送通知給管理員...');
    console.log(`訊息: ${message}`);
    console.log('=================================================');

    /* 真實程式碼預留區 (等拿到 Token 解開註解即可)
    const token = process.env.LINE_NOTIFY_TOKEN;
    if (token) {
      await axios.post(
        'https://notify-api.line.me/api/notify',
        `message=${encodeURIComponent(message)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    */
    return true;
  }
}
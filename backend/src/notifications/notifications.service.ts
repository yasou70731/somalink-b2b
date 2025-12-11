import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  private transporter;

  constructor() {
    // 1. 取得帳號 (同時相容 SMTP_USER 和 EMAIL_USER 兩種命名)
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    // 只有在設定了帳號時才啟用
    if (user && pass) {
      
      console.log(`📧 初始化 Gmail 郵件服務...`);
      console.log(`   - 使用者: ${user}`);
      console.log(`   - 模式: Port 465 (SSL)`);

      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',  // 強制鎖定 Gmail
        port: 465,               // 強制使用 SSL Port (Render 最穩定)
        secure: true,            // 465 必須為 true
        auth: {
          user: user,
          pass: pass,
        },
        // 增加連線設定，避免太快判定超時
        connectionTimeout: 20000, 
        greetingTimeout: 20000,
        socketTimeout: 20000
      });
      
    } else {
      console.warn('⚠️ [警告] 未偵測到 SMTP_USER 或 SMTP_PASS，郵件功能將僅顯示 Log');
    }
  }

  // 1. 寄送 Email
  async sendEmail(to: string, subject: string, text: string, html?: string) {
    // 開發模式或未設定 SMTP 時，只印 Log
    if (!this.transporter) {
      console.log('=================================================');
      console.log('📧 [模擬寄信] (未設定 SMTP 帳密)');
      console.log(`收件人: ${to}`);
      console.log(`主旨: ${subject}`);
      console.log('=================================================');
      return true;
    }

    try {
      console.log(`📧 正在發送郵件給 ${to}...`);
      
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"SomaLink System" <no-reply@somalink.com>',
        to,
        subject,
        text, 
        html: html || text.replace(/\n/g, '<br>'),
      });

      console.log(`✅ 郵件發送成功! Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ 郵件發送失敗 (Error Details):');
      console.error(error);
      return false;
    }
  }

  // 2. 發送 Line Notify (保持不變)
  async sendLineNotify(message: string) {
    const token = process.env.LINE_NOTIFY_TOKEN;
    
    if (!token) {
        // console.log('🔔 [模擬 Line] (未設定 Token)');
        return true;
    }

    try {
      await axios.post(
        'https://notify-api.line.me/api/notify',
        new URLSearchParams({ message }).toString(),
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return true;
    } catch (error) {
      console.error('Line Notify failed:', error);
      return false;
    }
  }
}
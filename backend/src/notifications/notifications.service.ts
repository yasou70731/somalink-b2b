import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  private transporter;

  constructor() {
    // 1. 取得帳號
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (user && pass) {
      
      console.log(`📧 初始化 Gmail 郵件服務...`);
      console.log(`   - 使用者: ${user}`);
      console.log(`   - 模式: Service 'gmail' (自動配置) | IPv4 強制`);

      this.transporter = nodemailer.createTransport({
        // ✨✨✨ 最後手段：使用 service: 'gmail' ✨✨✨
        // 這會自動載入 Nodemailer 內建針對 Gmail 的最佳設定 (包含 Port 和加密方式)
        // 這是最單純的設定方式，能排除所有手動設定錯誤
        service: 'gmail',
        
        auth: {
          user: user,
          pass: pass,
        },
        
        // 保持強制 IPv4 (這點對 Render 非常重要，不能拿掉)
        family: 4, 
        
        // 寬鬆的 TLS 憑證檢查
        tls: {
          rejectUnauthorized: false
        },

        // 設定 20 秒逾時，不要空等兩分鐘
        connectionTimeout: 20000, 
        greetingTimeout: 20000,
        socketTimeout: 20000,

        debug: true, 
        logger: true
      } as any);
      
    } else {
      console.warn('⚠️ [警告] 未偵測到 SMTP_USER 或 SMTP_PASS，郵件功能將僅顯示 Log');
    }
  }

  // 1. 寄送 Email
  async sendEmail(to: string, subject: string, text: string, html?: string) {
    if (!this.transporter) {
      console.log('=================================================');
      console.log('📧 [模擬寄信] (未設定 SMTP 帳密)');
      console.log(`收件人: ${to}`);
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
      if (error instanceof Error) {
        console.error(`- Code: ${(error as any).code}`);
        console.error(`- Command: ${(error as any).command}`);
        console.error(`- Message: ${error.message}`);
      } else {
        console.error(error);
      }
      return false;
    }
  }

  // 2. 發送 Line Notify
  async sendLineNotify(message: string) {
    const token = process.env.LINE_NOTIFY_TOKEN;
    if (!token) return true;

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
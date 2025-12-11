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

    // 只有在設定了帳號時才啟用
    if (user && pass) {
      
      console.log(`📧 初始化 Gmail 郵件服務...`);
      console.log(`   - 使用者: ${user}`);
      // ✨ 改回 Port 587，因為您之前的測試證明 587 網路是通的 (只報 401)，而 465 會 Timeout
      console.log(`   - 模式: Port 587 (STARTTLS) | 強制 IPv4`);

      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',  
        port: 587,               // ✨ 修正：改用 587
        secure: false,           // ✨ 修正：Port 587 必須設為 false (它會使用 STARTTLS 升級加密)
        auth: {
          user: user,
          pass: pass,
        },
        // ✨ 強制使用 IPv4 避免 Render 的 IPv6 連線問題
        family: 4, 
        
        // 寬鬆的 TLS 設定，避免憑證錯誤
        tls: {
          rejectUnauthorized: false 
        },

        // 延長超時設定
        connectionTimeout: 60000, 
        greetingTimeout: 60000,
        socketTimeout: 60000,

        // 開啟除錯模式，若失敗可以看到更多 SMTP 互動細節
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
      // 印出完整的錯誤物件以便除錯
      if (error instanceof Error) {
        console.error(`- Code: ${(error as any).code}`);
        console.error(`- Command: ${(error as any).command}`);
        console.error(`- Message: ${error.message}`);
        console.error(`- Stack: ${error.stack}`);
      } else {
        console.error(error);
      }
      return false;
    }
  }

  // 2. 發送 Line Notify (保持不變)
  async sendLineNotify(message: string) {
    const token = process.env.LINE_NOTIFY_TOKEN;
    
    if (!token) {
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
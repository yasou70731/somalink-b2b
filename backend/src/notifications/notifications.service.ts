import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  private transporter;

  constructor() {
    // 初始化 Nodemailer
    // 只有在設定了 SMTP_USER 時才啟用，避免開發環境報錯
    if (process.env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  // 1. 寄送 Email (給經銷商)
  async sendEmail(to: string, subject: string, text: string, html?: string) {
    // 開發模式或未設定 SMTP 時，只印 Log
    if (!this.transporter) {
      console.log('=================================================');
      console.log('📧 [模擬寄信] (未設定 SMTP)');
      console.log(`收件人: ${to}`);
      console.log(`主旨: ${subject}`);
      console.log(`內容: ${text}`);
      console.log('=================================================');
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"SomaLink System" <no-reply@example.com>',
        to,
        subject,
        text, // 純文字版本
        html: html || text.replace(/\n/g, '<br>'), // 簡單的 HTML 轉換
      });
      console.log(`✅ Email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }

  // 2. 發送 Line Notify (保持不變)
  async sendLineNotify(message: string) {
    const token = process.env.LINE_NOTIFY_TOKEN;
    
    if (!token) {
        console.log('=================================================');
        console.log('🔔 [模擬 Line] (未設定 Token)');
        console.log(`訊息: ${message}`);
        console.log('=================================================');
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
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
      
      // 1. 解析 Port，預設 465
      const port = Number(process.env.SMTP_PORT) || 465;

      // 2. 只有 Port 465 才啟用 secure (SSL)，Port 587 必須為 false (STARTTLS)
      const isSecure = port === 465;

      console.log(`📧 SMTP 設定初始化: Host=${process.env.SMTP_HOST} Port=${port} Secure=${isSecure}`);

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: port,
        secure: isSecure, // ✨ 修正：動態判斷，避免 Port 587 連線超時
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        // ✨ 新增：避免 Render 環境下的憑證驗證問題
        tls: {
          rejectUnauthorized: false
        },
        // 設定連線超時時間 (毫秒)
        connectionTimeout: 10000, 
        greetingTimeout: 10000,
        socketTimeout: 10000
      });
    } else {
      console.warn('⚠️ 未設定 SMTP_USER，郵件發送功能將被停用 (僅印出 Log)');
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
      console.log(`📧 嘗試發送郵件給 ${to}...`);
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
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  private transporter;

  constructor() {
    // 1. 讀取環境變數
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    // 預設使用 587，因為這是雲端環境最穩定的 Port
    const port = Number(process.env.SMTP_PORT) || 587; 
    
    // 自動判斷 secure 設定 (465 為 true，其他通常為 false)
    const isSecure = port === 465;

    if (user && pass) {
      
      console.log(`📧 初始化郵件服務...`);
      console.log(`   - Host: ${host}`);
      console.log(`   - Port: ${port}`);
      console.log(`   - User: ${user}`);
      console.log(`   - Secure: ${isSecure}`);
      console.log(`   - IPv4: 強制開啟`);

      this.transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: isSecure, 
        
        auth: {
          user: user,
          pass: pass,
        },
        
        // ✨✨✨ 關鍵設定：強制 IPv4 ✨✨✨
        // 無論環境變數怎麼設，這點對 Render 連接 Gmail 至關重要
        family: 4, 
        
        // 寬鬆的 TLS 憑證檢查
        tls: {
          rejectUnauthorized: false
        },

        // 連線逾時設定 (20秒)
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
        // 優先使用環境變數的寄件者名稱，若無則使用預設
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
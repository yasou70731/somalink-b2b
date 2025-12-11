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
      console.log(`   - 模式: Nodemailer Service 'gmail' (自動配置)`);

      this.transporter = nodemailer.createTransport({
        // ✨✨✨ 關鍵修改：不再手動設定 host/port ✨✨✨
        // 使用內建的 'gmail' 服務設定，它會自動處理 TLS/SSL 和端口選擇
        // 這通常比手動設定更能適應雲端環境
        service: 'gmail',
        
        auth: {
          user: user,
          pass: pass,
        },
        
        // 保持強制 IPv4 (這點對 Render 很重要)
        family: 4, 
        
        // 開啟除錯，若失敗方便查看
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
        // console.error(`- Stack: ${error.stack}`); // 暫時隱藏 Stack 讓 Log 乾淨點
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
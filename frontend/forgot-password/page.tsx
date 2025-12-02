'use client';

import { useState } from 'react';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 這裡未來可以接後端 API 發送重設信
    // 目前先模擬成功
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">忘記密碼</h2>
          <p className="mt-2 text-sm text-gray-500">
            請輸入您註冊的 Email，我們將協助您重設密碼。
          </p>
        </div>

        {isSubmitted ? (
          <div className="text-center space-y-6 animate-in fade-in">
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm">
              <p className="font-bold mb-1">申請已送出！</p>
              <p>請檢查您的信箱，或直接聯繫客服人員協助重設。</p>
            </div>
            <div className="text-sm text-gray-500">
              客服電話：(02) 2345-6789 <br/>
              Line ID: @somalink
            </div>
            <Link href="/login" className="block w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
              返回登入
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="name@company.com"
              />
            </div>

            <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm">
              <Send className="w-4 h-4" /> 發送重設連結
            </button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
                <ArrowLeft className="w-4 h-4" /> 返回登入
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
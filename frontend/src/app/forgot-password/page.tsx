'use client';

import { useState } from 'react';
import { ArrowLeft, Mail, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api'; // ✨ 引入真實 API

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // ✨ 呼叫後端 API
      await api.auth.forgotPassword(email);
      // 無論 Email 是否存在，都顯示成功 (安全性考量，避免枚舉攻擊)
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      alert('發送失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
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
          <p className="mt-2 text-sm text-gray-600">
            請輸入您註冊的 Email，我們將協助您重設密碼。
          </p>
        </div>

        {isSubmitted ? (
          <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm border border-green-100">
              <p className="font-bold mb-1 text-lg">申請已送出！</p>
              <p>若該 Email 存在於系統中，您將在幾分鐘內收到重設密碼的信件。</p>
              <p className="text-xs mt-2 text-gray-500">(開發模式：請查看後端 Terminal 取得連結)</p>
            </div>
            <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl">
              <p className="font-bold mb-1">沒收到信？</p>
              <p>請檢查垃圾郵件，或聯繫客服：</p>
              <p className="mt-1 font-mono text-blue-600">(02) 2345-6789</p>
            </div>
            <Link href="/login" className="block w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md">
              返回登入頁面
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
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="name@company.com"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Send className="w-4 h-4" /> 發送重設連結</>}
            </button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 transition-colors">
                <ArrowLeft className="w-4 h-4" /> 返回登入
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
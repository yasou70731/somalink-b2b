'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, Lock, Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // ✨ 新增：記住我狀態
  const [rememberMe, setRememberMe] = useState(false);
  
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await api.post('/auth/login', formData);
      const { access_token, user } = data;

      // ✨ 根據「記住我」選擇儲存位置
      if (rememberMe) {
        // 存入 LocalStorage (永久)
        localStorage.setItem('somalink_token', access_token);
        localStorage.setItem('somalink_user', JSON.stringify(user));
        // 清除 Session 以防萬一
        sessionStorage.removeItem('somalink_token');
        sessionStorage.removeItem('somalink_user');
      } else {
        // 存入 SessionStorage (關閉分頁即失效)
        sessionStorage.setItem('somalink_token', access_token);
        sessionStorage.setItem('somalink_user', JSON.stringify(user));
        // 清除 Local
        localStorage.removeItem('somalink_token');
        localStorage.removeItem('somalink_user');
      }

      router.push('/');
    } catch (err: any) {
      console.error('登入失敗:', err);
      if (err.response?.status === 401) {
        setErrorMsg('帳號或密碼錯誤');
      } else {
        setErrorMsg('系統連線錯誤，請確認後端是否已啟動');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-blue-200 shadow-md">
            S
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            經銷商登入
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            歡迎回到 松成有限公司 數位工廠
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-pulse">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email 帳號</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                <input type="email" required className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="your@company.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">密碼</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                <input type="password" required className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>
            </div>
          </div>

          {/* ✨ 新增：記住我 & 忘記密碼 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer select-none">
                記住我
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                忘記密碼？
              </Link>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg">
            {isLoading ? <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> : '登入系統'}
          </button>

          <div className="text-center space-y-3 mt-6 border-t border-gray-100 pt-6">
            <Link href="/register" className="block text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors">還沒有帳號？點此申請成為經銷商</Link>
            <Link href="/" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">← 先回首頁逛逛</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
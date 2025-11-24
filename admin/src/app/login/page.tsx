'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, Lock, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. 呼叫後端登入
      // ✨ Fix: api.post 已經回傳 data，所以直接解構即可，不需要再寫 .data
      const data = await api.post('/auth/login', formData);
      const { access_token, user } = data;

      // 2. 檢查是否為管理員
      // ✨ Fix: 同時允許大寫 ADMIN (後端預設) 與小寫 admin
      if (user.role !== 'ADMIN' && user.role !== 'admin') {
        setErrorMsg('權限不足：您不是系統管理員');
        setIsLoading(false);
        return;
      }

      // 3. 儲存 Token
      localStorage.setItem('somalink_admin_token', access_token);
      localStorage.setItem('somalink_admin_user', JSON.stringify(user));
      
      // 4. 進入戰情室
      router.push('/');

    } catch (err: any) {
      console.error('登入失敗:', err);
      if (err.response?.status === 401) {
        setErrorMsg('帳號或密碼錯誤');
      } else {
        // 顯示具體的錯誤訊息，方便除錯
        setErrorMsg(err.message || '系統連線錯誤');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-2xl">
        
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-slate-800 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            松成有限公司
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-medium tracking-wide uppercase">
            工廠管理後台
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">管理員帳號</label>
              <input
                type="email"
                required
                className="block w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all"
                placeholder="admin@somalink.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">密碼</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  className="block w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <Lock className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-70 transition-all shadow-lg"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : '進入後台系統'}
          </button>
        </form>
        
        <div className="text-center text-xs text-gray-400 mt-4">
          此區域僅限授權人員進入，IP 位置將被記錄。
        </div>
      </div>
    </div>
  );
}
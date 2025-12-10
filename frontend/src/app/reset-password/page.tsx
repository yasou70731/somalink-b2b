'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

// ✅ 定義錯誤型別
interface ApiError {
  response?: {
    data?: { message?: string };
  };
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('兩次密碼輸入不一致');
      return;
    }
    
    if (!token) return;

    setIsLoading(true);
    try {
      await api.auth.resetPassword(token, password);
      setIsSuccess(true);
    } catch (error) {
      // ✅ 修正：使用型別斷言
      const err = error as ApiError;
      console.error(err);
      setErrorMsg(err.response?.data?.message || '重設失敗，連結可能已過期或無效');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
      
      <div className="text-center mb-8">
        <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">重設密碼</h2>
        <p className="mt-2 text-sm text-gray-600">
          請輸入您的新密碼以恢復帳號存取權。
        </p>
      </div>

      {isSuccess ? (
        <div className="text-center space-y-6 animate-in fade-in">
          <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm border border-green-100 flex flex-col items-center">
            <CheckCircle className="w-8 h-8 mb-2" />
            <p className="font-bold text-lg">密碼重設成功！</p>
            <p>您現在可以使用新密碼登入了。</p>
          </div>
          <Link href="/login" className="block w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md text-center">
            前往登入
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">新密碼</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="請輸入新密碼 (至少 6 碼)"
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">確認新密碼</label>
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="再次輸入新密碼"
                minLength={6}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : '確認重設'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
      <Suspense fallback={<Loader2 className="animate-spin w-10 h-10 text-blue-600" />}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, UserPlus, Building2, FileText, User, Phone, Mail, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    taxId: '', // 統編
    contactPerson: '',
    phone: '',
    address: '' // 地址 (可選)
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 呼叫後端 API: POST /users
      // 後端會自動建立 User + DealerProfile (預設 C 級)
      await api.post('/users', formData);
      
      alert('🎉 申請成功！請使用剛設定的帳號密碼登入。');
      router.push('/login'); // 註冊完導回登入頁

    } catch (err: any) {
      console.error(err);
      // 如果後端回傳錯誤 (例如 Email 重複)
      const msg = err.response?.data?.message || '註冊失敗，請稍後再試';
      alert(`註冊失敗：${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-green-200 shadow-md">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            申請成為經銷商
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            填寫公司資料，加入 SomaLink B2B 供應鏈
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          
          {/* 帳號密碼區 */}
          <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">登入資訊</p>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input name="email" type="email" required placeholder="Email (作為登入帳號)" onChange={handleChange} 
                className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input name="password" type="password" required placeholder="設定密碼" onChange={handleChange} 
                className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white" />
            </div>
          </div>

          {/* 公司資料區 */}
          <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">公司資料</p>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input name="companyName" required placeholder="公司名稱 / 行號" onChange={handleChange} 
                className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white" />
            </div>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input name="taxId" required placeholder="統一編號" onChange={handleChange} 
                className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white" />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input name="contactPerson" required placeholder="聯絡人姓名" onChange={handleChange} 
                className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white" />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input name="phone" required placeholder="聯絡電話 / 手機" onChange={handleChange} 
                className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white" />
            </div>
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 shadow-md transition-all disabled:opacity-70 mt-6">
            {isLoading ? <Loader2 className="animate-spin" /> : '提交申請'}
          </button>

          <div className="text-center mt-4">
            <Link href="/login" className="text-sm text-green-600 hover:underline flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" /> 已有帳號？返回登入
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}
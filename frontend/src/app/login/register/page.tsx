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
    address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 呼叫後端註冊 API
      // 後端會自動建立 User + DealerProfile (預設 C 級)
      await api.post('/users', formData);
      
      alert('🎉 註冊成功！請使用剛建立的帳號登入。');
      router.push('/login'); // 導向登入頁

    } catch (err: any) {
      console.error(err);
      alert('註冊失敗：' + (err.response?.data?.message || '請檢查資料是否正確'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            申請成為經銷商
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            加入 SomaLink，享受 B2B 專屬價格與服務
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          
          {/* 帳號密碼區 */}
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input name="email" type="email" required placeholder="Email (登入帳號)" onChange={handleChange} 
                className="w-full pl-10 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input name="password" type="password" required placeholder="設定密碼" onChange={handleChange} 
                className="w-full pl-10 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="border-t border-gray-100 my-4"></div>

          {/* 公司資料區 */}
          <div className="space-y-2">
            <div className="relative">
              <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input name="companyName" required placeholder="公司名稱" onChange={handleChange} 
                className="w-full pl-10 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input name="taxId" required placeholder="統一編號" onChange={handleChange} 
                className="w-full pl-10 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input name="contactPerson" required placeholder="聯絡人姓名" onChange={handleChange} 
                className="w-full pl-10 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input name="phone" required placeholder="聯絡電話" onChange={handleChange} 
                className="w-full pl-10 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all disabled:opacity-70">
            {isLoading ? <Loader2 className="animate-spin" /> : <><UserPlus className="w-5 h-5 mr-2" /> 提交申請</>}
          </button>

          <div className="text-center mt-4">
            <Link href="/login" className="text-sm text-blue-600 hover:underline flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" /> 已有帳號？返回登入
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}
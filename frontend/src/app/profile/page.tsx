'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Save, User, Building2, Phone, MapPin, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, reset } = useForm({
    defaultValues: {
      name: '',
      email: '',
      companyName: '',
      taxId: '',
      phone: '',
      address: '',
      password: '', // 選填：若填寫則修改密碼
      confirmPassword: ''
    }
  });

  useEffect(() => {
    // 載入當前使用者資料
    const fetchProfile = async () => {
      try {
        // ✨ 修正重點：同時檢查 LocalStorage 與 SessionStorage
        const storedUser = localStorage.getItem('somalink_user') || sessionStorage.getItem('somalink_user');
        
        if (!storedUser) {
          router.push('/login');
          return;
        }
        
        const user = JSON.parse(storedUser);
        
        // 將資料填入表單
        reset({
          name: user.dealerProfile?.contactPerson || user.name,
          email: user.email,
          companyName: user.dealerProfile?.companyName,
          taxId: user.dealerProfile?.taxId,
          phone: user.dealerProfile?.phone,
          address: user.dealerProfile?.address,
        });
      } catch (err) {
        console.error(err);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [router, reset]);

  const onSubmit = async (data: any) => {
    if (data.password && data.password !== data.confirmPassword) {
      alert('兩次密碼輸入不一致');
      return;
    }

    setIsSubmitting(true);
    try {
      // 呼叫後端更新
      const payload = {
        name: data.name, // 聯絡人
        password: data.password || undefined, // 若為空則不傳
        dealerProfile: {
          companyName: data.companyName,
          taxId: data.taxId,
          contactPerson: data.name,
          phone: data.phone,
          address: data.address
        }
      };

      const updatedUser = await api.patch('/users/profile', payload);
      
      // ✨ 更新儲存空間 (需判斷原本存在哪裡，保持登入狀態一致)
      if (localStorage.getItem('somalink_user')) {
        localStorage.setItem('somalink_user', JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem('somalink_user', JSON.stringify(updatedUser));
      }
      
      alert('資料更新成功！');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('更新失敗，請檢查網路或稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">會員資料設定</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* 基本資料卡片 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" /> 公司與聯絡資訊
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">公司名稱</label>
                <input {...register('companyName')} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">統一編號</label>
                <input {...register('taxId')} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">聯絡人姓名</label>
                <input {...register('name')} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">聯絡電話</label>
                <input {...register('phone')} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">通訊地址</label>
                <input {...register('address')} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          {/* 帳號安全卡片 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" /> 帳號安全
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">登入 Email (不可修改)</label>
                <input {...register('email')} disabled className="w-full p-3 border border-gray-200 bg-gray-100 rounded-xl text-gray-500 cursor-not-allowed" />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-4">若需修改密碼請填寫下方欄位，否則請留空。</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">新密碼</label>
                    <input type="password" {...register('password')} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="不修改請留空" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">確認新密碼</label>
                    <input type="password" {...register('confirmPassword')} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="再次輸入新密碼" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/" className="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">
              取消
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md flex items-center gap-2 disabled:opacity-70 transition-all"
            >
              {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-5 h-5" /> 儲存變更</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
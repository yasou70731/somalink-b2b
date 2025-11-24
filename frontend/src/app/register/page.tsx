'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Mail, Lock, User, Phone, MapPin, FileText, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

// 定義營業類別型別
interface TradeCategory {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<TradeCategory[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // 表單狀態
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '', // 聯絡人姓名
    companyName: '',
    taxId: '',
    phone: '',
    address: '',
    tradeCategoryId: '',
  });

  // ✨ 修正：載入真實的營業類別
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // 從後端 API 取得資料 (這樣才會拿到正確的 UUID)
        const res = await api.get('/trade-categories');
        // 兼容 API 回傳可能是陣列或 { data: [] } 的格式
        const data = Array.isArray(res) ? res : (res.data || []);
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories', err);
        // 如果抓不到資料 (例如後端沒開放權限)，至少給一個空陣列，不要用假資料害自己
        setCategories([]); 
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('兩次密碼輸入不一致');
      return;
    }

    setIsSubmitting(true);

    try {
      // 構建傳送給後端的資料
      const payload = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        // ✨ 關鍵修正：如果是空字串，轉為 undefined，避免後端查詢出錯
        tradeCategoryId: formData.tradeCategoryId || undefined,
        dealerProfile: {
          companyName: formData.companyName,
          taxId: formData.taxId,
          contactPerson: formData.name,
          phone: formData.phone,
          address: formData.address,
        },
      };

      await api.post('/users', payload);
      
      alert('🎉 註冊成功！\n請等待管理員審核開通帳號。');
      router.push('/login');

    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || '註冊失敗，請稍後再試';
      setErrorMsg(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">註冊經銷商帳號</h2>
          <p className="mt-2 text-sm text-gray-600">
            加入 SomaLink，享受 B2B 數位工廠服務
          </p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm animate-pulse">
            <AlertCircle className="w-4 h-4" />
            {errorMsg}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* 帳號資訊 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (登入帳號)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    name="email"
                    type="email"
                    required
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    name="password"
                    type="password"
                    required
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                    placeholder="******"
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">確認密碼</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                  placeholder="******"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="grow border-t border-gray-200"></div>
              <span className="shrink-0 mx-4 text-gray-400 text-xs">公司資料</span>
              <div className="grow border-t border-gray-200"></div>
            </div>

            {/* 公司資訊 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">公司名稱</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    name="companyName"
                    type="text"
                    required
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如：松成有限公司"
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">聯絡人姓名</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                    placeholder="王小明"
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">聯絡電話</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      name="phone"
                      type="tel"
                      required
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0912-345-678"
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">統一編號 (選填)</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      name="taxId"
                      type="text"
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                      placeholder="8碼統編"
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">營業類別</label>
                  <select
                    name="tradeCategoryId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white"
                    onChange={handleChange}
                    value={formData.tradeCategoryId}
                  >
                    <option value="">請選擇...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">公司地址</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    name="address"
                    type="text"
                    required
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                    placeholder="請輸入完整地址"
                    onChange={handleChange}
                  />
                </div>
              </div>

            </div>

          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors shadow-lg hover:shadow-xl"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              '註冊帳號'
            )}
          </button>

          <div className="text-center">
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 text-sm">
              已經有帳號？返回登入
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
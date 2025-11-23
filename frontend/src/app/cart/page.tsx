'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, ArrowRight, Loader2, ShoppingBag, AlertCircle, Hammer, Package, MessageSquare } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { api } from '@/lib/api';

export default function CartPage() {
  const router = useRouter();
  const { items, removeFromCart, clearCart, cartTotal } = useCart();
  
  // 解決 Hydration Mismatch 問題
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [projectName, setProjectName] = useState('');
  // ✨ 新增：訂單備註狀態
  const [customerNote, setCustomerNote] = useState(''); 
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!projectName.trim()) {
      alert('請輸入案場名稱 (例如：台北帝寶 A 棟)');
      return;
    }
    if (!agreed) {
      alert('請勾選同意免責聲明');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        projectName: projectName,
        customerNote: customerNote, // ✨ 傳送備註給後端
        agreedToDisclaimer: agreed,
        items: items.map(item => ({
          productId: item.productId,
          serviceType: item.serviceType,
          widthMatrix: item.widthMatrix,
          heightData: item.heightData,
          isCeilingMounted: item.isCeilingMounted,
          siteConditions: item.siteConditions,
          colorName: item.colorName,
          materialName: item.materialName,
          openingDirection: item.openingDirection,
          hasThreshold: item.hasThreshold,
          quantity: item.quantity,
          subtotal: item.subtotal,
          priceSnapshot: item.priceSnapshot
        }))
      };

      await api.post('/orders', payload);
      
      clearCart();
      alert('🚀 訂單已送出！');
      router.push('/orders');

    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 401) {
        alert('請先登入會員');
        router.push('/login');
      } else {
        alert('結帳失敗，請聯繫管理員。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">購物車是空的</h2>
        <p className="text-gray-500 mb-8 max-w-sm">看起來您還沒有加入任何門扇。去逛逛我們的產品系列，開始您的數位工廠之旅吧！</p>
        <Link href="/" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
          前往選購
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">確認訂單內容</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* 左側：商品列表 */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div key={item.internalId} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row gap-6 relative group">
                
                <button 
                  onClick={() => removeFromCart(item.internalId)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <div className="w-24 h-24 bg-gray-100 rounded-xl shrink-0 overflow-hidden">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src="https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=200" alt={item.productName} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{item.productName}</h3>
                    {/* 顯示服務模式標籤 */}
                    {item.serviceType === 'material' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                        <Package className="w-3 h-3" /> 純材料
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        <Hammer className="w-3 h-3" /> 連工帶料
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">規格：</span>{item.colorName} / {item.materialName} / {item.openingDirection}</p>
                    <p>
                      <span className="font-medium">尺寸：</span>
                      W {item.widthMatrix.mid}cm x H {item.heightData.singleValue || item.heightData.mid || 'N/A'}cm
                      {item.isCeilingMounted && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">封頂</span>}
                    </p>
                    {item.siteConditions?.floor && (
                      <p className="text-orange-600 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> 地面水平誤差: {item.siteConditions.floor.diff}cm
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-blue-600">${item.subtotal.toLocaleString()}</span>
                      <span className="text-xs text-gray-400">
                        ({item.serviceType === 'material' ? '材料買斷價' : '含工資打包價'})
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">數量: {item.quantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 右側：結帳面板 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">訂單摘要</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>商品總數</span>
                  <span>{items.length} 件</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-4 border-t border-gray-100">
                  <span>總金額</span>
                  <span>${cartTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* 案場名稱輸入 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">案場名稱 / 備註 *</label>
                <input 
                  type="text" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="例：台北帝寶 A 棟"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* ✨ 新增：訂單備註輸入框 (已修正 CSS 衝突) */}
              <div className="mb-6">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4" /> 訂單備註 (選填)
                </label>
                <textarea 
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="例如：請週六配送、需要事先聯絡..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all h-24 resize-none text-sm"
                />
              </div>

              <label className="flex items-start gap-3 mb-6 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  我已確認上述尺寸與規格無誤。我瞭解客製化商品一旦下單生產即無法退換貨，並同意 <span className="text-blue-600 underline">服務條款</span>。
                </span>
              </label>

              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>確認下單 <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
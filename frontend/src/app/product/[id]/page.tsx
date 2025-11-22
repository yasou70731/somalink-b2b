'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Ruler, Check, ShoppingCart, Minus, Plus, ArrowRight, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import MeasurementModal, { MeasurementData } from '@/components/MeasurementModal';
import { api } from '@/lib/api';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // 模擬產品資料
  const product = {
    id: "67240c89-d8ed-46eb-b8ce-0264642b3f44", // 記得確認這個 UUID 是否為您資料庫的真實 ID
    name: "極簡細框拉門 X1",
    price: 5000,
    requiresMeasurement: true,
    colors: [
      { id: 'black', name: '消光黑', colorCode: '#333333', surcharge: 0 },
      { id: 'white', name: '純白', colorCode: '#FFFFFF', surcharge: 0 },
      { id: 'gold', name: '香檳金', colorCode: '#D4AF37', surcharge: 500 },
    ],
    materials: [
      { id: 'clear', name: '8mm 清玻', surcharge: 0 },
      { id: 'frosted', name: '5mm 霧玻', surcharge: 0 },
      { id: 'line', name: '長虹玻璃', surcharge: 1200 },
    ],
    // ✨ 修正處：只保留這兩個滑門選項
    openingOptions: ['左往右開', '右往左開'] 
  };

  // 狀態管理
  const [selectedColor, setSelectedColor] = useState(product.colors[0].id);
  const [selectedMaterial, setSelectedMaterial] = useState(product.materials[0].id);
  // ✨ 預設選第一個
  const [openingDirection, setOpeningDirection] = useState(product.openingOptions[0]); 
  const [isMeasureOpen, setIsMeasureOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 計算價格
  const currentColor = product.colors.find(c => c.id === selectedColor);
  const currentMaterial = product.materials.find(m => m.id === selectedMaterial);
  const unitPrice = product.price + (currentColor?.surcharge || 0) + (currentMaterial?.surcharge || 0);
  const totalPrice = unitPrice * quantity;

  // 送出訂單邏輯
  const handleCheckout = async (measureData?: MeasurementData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        productId: product.id,
        projectName: "未命名案場",
        serviceType: "assembled",
        colorName: currentColor?.name,
        materialName: currentMaterial?.name,
        openingDirection: openingDirection,
        hasThreshold: false,
        totalPrice: totalPrice,
        widthMatrix: measureData?.width || { top: 0, mid: 0, bot: 0 },
        heightData: measureData?.height || { left: 0, mid: 0, right: 0 },
        isCeilingMounted: measureData?.isCeilingMounted ?? false,
        siteConditions: {
          floor: measureData?.floorError,
        },
        agreedToDisclaimer: true
      };

      await api.post('/orders', payload);
      alert('🎉 下單成功！訂單已送至工廠審核。');
      router.push('/');

    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 401) {
        alert('請先登入才能下單！');
        router.push('/login');
      } else {
        alert('下單失敗，請稍後再試。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* 左側圖片 */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={product.name} />
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md">系列 ID: {id}</div>
            </div>
          </div>

          {/* 右側規格 */}
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-600">${unitPrice.toLocaleString()}</span>
                <span className="text-sm text-gray-500">/ 單價</span>
              </div>
            </div>

            {/* 顏色選擇 */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
                <span>鋁框顏色</span>
                <span className="text-xs text-gray-500 font-normal">已選：{currentColor?.name}</span>
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {product.colors.map((color) => (
                  <button key={color.id} onClick={() => setSelectedColor(color.id)} className={clsx("relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all", selectedColor === color.id ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50")}>
                    <span className="w-6 h-6 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: color.colorCode }} />
                    <span className={clsx("text-sm font-medium", selectedColor === color.id ? "text-blue-900" : "text-gray-700")}>{color.name}</span>
                    {color.surcharge > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm font-bold">+${color.surcharge}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* 材質選擇 */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
                <span>玻璃/板材</span>
                <span className="text-xs text-gray-500 font-normal">已選：{currentMaterial?.name}</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {product.materials.map((mat) => (
                  <button key={mat.id} onClick={() => setSelectedMaterial(mat.id)} className={clsx("relative p-3 rounded-xl border-2 transition-all text-left", selectedMaterial === mat.id ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50")}>
                    <span className={clsx("text-sm font-medium block", selectedMaterial === mat.id ? "text-blue-900" : "text-gray-700")}>{mat.name}</span>
                    {mat.surcharge > 0 && <span className="text-xs text-red-500 font-medium block mt-1">+${mat.surcharge}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* ✨ 開門方向選擇 (已修正) */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">開門方向</h3>
              <div className="grid grid-cols-2 gap-3">
                {product.openingOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setOpeningDirection(opt)}
                    className={clsx(
                      "py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center",
                      openingDirection === opt 
                        ? "border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600" 
                        : "border-gray-200 bg-white hover:border-gray-300 text-gray-500"
                    )}
                  >
                    {/* 簡單的箭頭示意 */}
                    {opt === '左往右開' ? '⬅️ 左往右開' : '➡️ 右往左開'}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* 下單按鈕區 (略) */}
            {product.requiresMeasurement ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg text-yellow-700"><Ruler className="w-6 h-6" /></div>
                  <div><h4 className="text-yellow-900 font-bold">此產品需輸入丈量數據</h4><p className="text-sm text-yellow-700 mt-1">請準備好現場寬度與高度數據。</p></div>
                </div>
                <button 
                  onClick={() => setIsMeasureOpen(true)}
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><Ruler className="w-5 h-5" /> 開始丈量並下單</>}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* ... 直接購買區 ... */}
                <button className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl">加入購物車</button>
              </div>
            )}

            <MeasurementModal 
              isOpen={isMeasureOpen}
              onClose={() => setIsMeasureOpen(false)}
              onConfirm={(data) => handleCheckout(data)}
            />

          </div>
        </div>
      </div>
    </div>
  );
}
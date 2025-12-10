'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; // ✅ 1. 引入 Next Image
import { Ruler, Loader2, Hammer, Package, ArrowLeft, GripHorizontal, CheckCircle, BadgePercent } from 'lucide-react';
import clsx from 'clsx';
import MeasurementModal, { MeasurementData } from '@/components/MeasurementModal';
import { useCart, CartItem } from '@/context/CartContext';
import { api } from '@/lib/api';

// ✅ 2. 定義詳細的資料型別，解決大量的 any
interface ProductOption {
  name: string;
  priceSurcharge?: number;
  colorCode?: string;
}

interface ProductDetail {
  id: string;
  name: string;
  series?: string;
  sku?: string;
  basePrice: number;
  assemblyFee?: number;
  discountA?: number;
  discountB?: number;
  images: string[];
  imageUrl?: string; // 相容舊資料
  colors?: ProductOption[];
  materials?: ProductOption[];
  handles?: ProductOption[];
  openingOptions?: string[];
  requiresMeasurement?: boolean;
  pricePerUnitWidth?: number;
  pricePerUnitHeight?: number;
  standardWidth?: number;
  standardHeight?: number;
}

interface SystemRules {
  discount_level_A?: number;
  discount_level_B?: number;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToCart } = useCart();

  // ✅ 3. 使用定義好的型別
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [systemRules, setSystemRules] = useState<SystemRules | null>(null); 
  const [userLevel, setUserLevel] = useState<string>('C');   
  
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // 選項狀態
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [selectedHandle, setSelectedHandle] = useState<string>('');
  const [openingDirection, setOpeningDirection] = useState<string>('');
  const [serviceType, setServiceType] = useState<'material' | 'assembled'>('assembled'); 
  
  const [isMeasureOpen, setIsMeasureOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [quantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. 載入資料 (含權限檢查)
  useEffect(() => {
    // 檢查是否登入
    const token = localStorage.getItem('somalink_token') || sessionStorage.getItem('somalink_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    setAuthChecking(false);

    const fetchData = async () => {
      try {
        // A. 抓產品
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prodRes: any = await api.get(`/products/${id}`);
        const prodData: ProductDetail = prodRes.data || prodRes; 
        
        // 圖片防呆處理
        if (!prodData.images || !Array.isArray(prodData.images) || prodData.images.length === 0) {
            if (prodData.imageUrl) prodData.images = [prodData.imageUrl];
            else prodData.images = ["https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800"];
        }
        setProduct(prodData);
        
        // 設定預設選項
        if (prodData.colors && prodData.colors.length > 0) setSelectedColor(prodData.colors[0].name);
        if (prodData.materials && prodData.materials.length > 0) setSelectedMaterial(prodData.materials[0].name);
        if (prodData.handles && prodData.handles.length > 0) setSelectedHandle(prodData.handles[0].name);
        if (prodData.openingOptions && prodData.openingOptions.length > 0) setOpeningDirection(prodData.openingOptions[0]);

        // B. 抓系統規則
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ruleRes: any = await api.get('/site-config/rules');
          if (ruleRes?.settings) setSystemRules(ruleRes.settings);
        // ✅ 4. 移除未使用的 e
        } catch { console.error('無法讀取系統規則 (使用預設值)'); }

        // C. 抓會員等級
        const storedUser = localStorage.getItem('somalink_user') || sessionStorage.getItem('somalink_user');
        if (storedUser) {
          try {
            const u = JSON.parse(storedUser);
            if (u.dealerProfile?.level) setUserLevel(u.dealerProfile.level);
          } catch { console.error('解析會員資料失敗'); }
        }

      } catch (err) {
        console.error('資料載入失敗', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  if (authChecking || loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!product) return <div className="min-h-screen flex justify-center items-center">找不到產品</div>;

  // 2. 計算折數與價格
  let discountMultiplier = 1.0; 
  const productDiscountA = product.discountA != null ? Number(product.discountA) : null;
  const productDiscountB = product.discountB != null ? Number(product.discountB) : null;
  const systemDiscountA = systemRules?.discount_level_A ? Number(systemRules.discount_level_A) : 1.0;
  const systemDiscountB = systemRules?.discount_level_B ? Number(systemRules.discount_level_B) : 1.0;

  if (userLevel === 'A') {
    discountMultiplier = productDiscountA ?? systemDiscountA;
  } else if (userLevel === 'B') {
    discountMultiplier = productDiscountB ?? systemDiscountB;
  }

  // ✅ 5. 因為有型別，這裡不需要再寫 (c: any) 了
  const currentColorObj = product.colors?.find(c => c.name === selectedColor);
  const currentMaterialObj = product.materials?.find(m => m.name === selectedMaterial);
  const currentHandleObj = product.handles?.find(h => h.name === selectedHandle);

  let rawUnitPrice = Number(product.basePrice || 0) + 
                     (Number(currentColorObj?.priceSurcharge) || 0) + 
                     (Number(currentMaterialObj?.priceSurcharge) || 0) +
                     (Number(currentHandleObj?.priceSurcharge) || 0);
  
  const assemblyFee = Number(product.assemblyFee) || 3000;
  if (serviceType === 'assembled') rawUnitPrice += assemblyFee;

  const finalUnitPrice = Math.round(rawUnitPrice * discountMultiplier);

  // 3. 加入購物車邏輯
  const handleAddToCart = (measureData?: MeasurementData) => {
    setIsSubmitting(true);

    let sizeSurcharge = 0;
    const pricePerW = Number(product.pricePerUnitWidth) || 0;
    const pricePerH = Number(product.pricePerUnitHeight) || 0;
    const stdW = Number(product.standardWidth) || 90;
    const stdH = Number(product.standardHeight) || 210;

    if (measureData && product.requiresMeasurement) {
      const wValues = [measureData.width.top, measureData.width.mid, measureData.width.bot];
      const maxW = Math.max(...wValues); 
      const hValues = [measureData.height.left, measureData.height.mid, measureData.height.right];
      const maxH = measureData.height.singleValue || Math.max(...hValues); 

      if (maxW > stdW) sizeSurcharge += Math.ceil((maxW - stdW) / 10) * pricePerW;
      if (maxH > stdH) sizeSurcharge += Math.ceil((maxH - stdH) / 10) * pricePerH;
    }

    const finalSizeSurcharge = Math.round(sizeSurcharge * discountMultiplier);
    const totalUnitPrice = finalUnitPrice + finalSizeSurcharge;
    const totalSubtotal = totalUnitPrice * quantity;

    const newItem: CartItem = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      internalId: crypto.randomUUID() as any, // 暫時處理，視後端需求
      productId: product.id,
      productName: product.name,
      unitPrice: totalUnitPrice,
      quantity: quantity,
      subtotal: totalSubtotal,
      serviceType: serviceType, 
      colorName: selectedColor || '標準',
      materialName: selectedMaterial || '標準',
      handleName: selectedHandle || '無',
      openingDirection: openingDirection || '無',
      hasThreshold: false,
      widthMatrix: measureData?.width || { top: 0, mid: 0, bot: 0 },
      heightData: measureData?.height || { left: 0, mid: 0, right: 0 },
      isCeilingMounted: measureData?.isCeilingMounted ?? false,
      siteConditions: measureData?.floorError ? { floor: measureData.floorError } : undefined,
      priceSnapshot: {
        basePrice: Number(product.basePrice || 0),
        sizeSurcharge: finalSizeSurcharge, 
        colorSurcharge: Number(currentColorObj?.priceSurcharge) || 0,
        materialSurcharge: Number(currentMaterialObj?.priceSurcharge) || 0,
        handleSurcharge: Number(currentHandleObj?.priceSurcharge) || 0,
        assemblyFee: serviceType === 'assembled' ? assemblyFee : 0,
        thresholdFee: 0
      }
    };

    addToCart(newItem);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsMeasureOpen(false);
      let msg = '';
      if (finalSizeSurcharge > 0) msg = `(含尺寸加價 $${finalSizeSurcharge.toLocaleString()})`;
      setSuccessMsg(msg);
      setShowSuccessModal(true);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <Link href={product.series ? `/series/${encodeURIComponent(product.series)}` : "/"} className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium">
            <ArrowLeft className="w-5 h-5" /> 返回 {product.series || '首頁'}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* 左側圖片畫廊 */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm relative group">
              {/* ✅ 6. 改用 Next Image */}
              <Image 
                src={product.images[activeImageIndex]} 
                alt={product.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                {product.images.map((img: string, idx: number) => (
                  <button key={idx} onClick={() => setActiveImageIndex(idx)} className={clsx("relative w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all snap-start", activeImageIndex === idx ? "border-blue-600 ring-2 ring-blue-100" : "border-transparent hover:border-gray-300")}>
                    {/* ✅ 改用 Next Image */}
                    <Image 
                      src={img} 
                      alt={`Thumbnail ${idx}`} 
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-8">
            
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
              
              {/* 會員等級標籤 */}
              {discountMultiplier < 1 && (
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-red-200">
                  <BadgePercent className="w-4 h-4" />
                  {userLevel} 級會員專屬優惠 ({(discountMultiplier * 10).toFixed(1)}折)
                </div>
              )}

              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-500 text-sm mt-1">{product.series} / {product.sku}</p>
              
              <div className="mt-4 flex items-end gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-blue-600">${finalUnitPrice.toLocaleString()}</span>
                  <span className="text-sm text-gray-500">/ {serviceType === 'assembled' ? '連工帶料' : '純材料'}</span>
                </div>
                {discountMultiplier < 1 && (
                  <span className="text-sm text-gray-400 line-through mb-1">原價 ${rawUnitPrice.toLocaleString()}</span>
                )}
              </div>
              
              {product.requiresMeasurement && <p className="text-xs text-orange-600 mt-2 bg-orange-50 px-2 py-1 rounded inline-block">* 實際價格將於輸入丈量尺寸後計算 (標準 {product.standardWidth}x{product.standardHeight}cm 內不加價)</p>}
            </div>

            {/* 服務模式 */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">服務模式</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setServiceType('material')} className={clsx("flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all", serviceType === 'material' ? "border-gray-600 bg-gray-100 text-gray-900 ring-1 ring-gray-600" : "border-gray-200 bg-white hover:border-gray-300 text-gray-500")}><Package className="w-4 h-4" /> 純材料 (DIY)</button>
                <button onClick={() => setServiceType('assembled')} className={clsx("flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all", serviceType === 'assembled' ? "border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600" : "border-gray-200 bg-white hover:border-gray-300 text-gray-500")}><Hammer className="w-4 h-4" /> 連工帶料 (含安裝)</button>
              </div>
              {serviceType === 'assembled' && <p className="text-xs text-blue-600 mt-2 ml-1">* 已包含標準安裝費 ${assemblyFee.toLocaleString()}</p>}
            </div>

            {/* 顏色選擇 */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between"><span>鋁框顏色</span><span className="text-xs text-gray-500 font-normal">已選：{selectedColor}</span></h3>
                <div className="grid grid-cols-3 gap-3">
                  {product.colors.map((color, idx) => (
                    <button key={idx} onClick={() => setSelectedColor(color.name)} className={clsx("relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all", selectedColor === color.name ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50")}><span className="w-6 h-6 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: color.colorCode || '#000' }} /><span className={clsx("text-sm font-medium", selectedColor === color.name ? "text-blue-900" : "text-gray-700")}>{color.name}</span>{Number(color.priceSurcharge) > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm font-bold">+${color.priceSurcharge}</span>}</button>
                  ))}
                </div>
              </div>
            )}

            {/* 材質選擇 */}
            {product.materials && product.materials.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between"><span>玻璃/板材</span><span className="text-xs text-gray-500 font-normal">已選：{selectedMaterial}</span></h3>
                <div className="grid grid-cols-2 gap-3">
                  {product.materials.map((mat, idx) => (
                    <button key={idx} onClick={() => setSelectedMaterial(mat.name)} className={clsx("relative p-3 rounded-xl border-2 transition-all text-left", selectedMaterial === mat.name ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50")}><span className={clsx("text-sm font-medium block", selectedMaterial === mat.name ? "text-blue-900" : "text-gray-700")}>{mat.name}</span>{Number(mat.priceSurcharge) > 0 && <span className="text-xs text-red-500 font-medium block mt-1">+${mat.priceSurcharge}</span>}</button>
                  ))}
                </div>
              </div>
            )}

            {/* 把手選擇 */}
            {product.handles && product.handles.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between"><span>把手配件</span><span className="text-xs text-gray-500 font-normal">已選：{selectedHandle}</span></h3>
                <div className="grid grid-cols-2 gap-3">
                  {product.handles.map((h, idx) => (
                    <button key={idx} onClick={() => setSelectedHandle(h.name)} className={clsx("relative p-3 rounded-xl border-2 transition-all flex items-center gap-3", selectedHandle === h.name ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50")}>
                      <GripHorizontal className={clsx("w-5 h-5", selectedHandle === h.name ? "text-blue-600" : "text-gray-400")} />
                      <span className={clsx("text-sm font-medium flex-1 text-left", selectedHandle === h.name ? "text-blue-900" : "text-gray-700")}>{h.name}</span>
                      {Number(h.priceSurcharge) > 0 && <span className="text-xs text-red-500 font-medium">+${h.priceSurcharge}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 開門方向 */}
            {product.openingOptions && product.openingOptions.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">開門方向</h3>
                <div className="grid grid-cols-2 gap-3">
                  {product.openingOptions.map((opt, idx) => (
                    <button key={idx} onClick={() => setOpeningDirection(opt)} className={clsx("py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center", openingDirection === opt ? "border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600" : "border-gray-200 bg-white hover:border-gray-300 text-gray-500")}>{opt}</button>
                  ))}
                </div>
              </div>
            )}

            <hr className="border-gray-100" />

            {product.requiresMeasurement ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-4"><div className="p-2 bg-yellow-100 rounded-lg text-yellow-700"><Ruler className="w-6 h-6" /></div><div><h4 className="text-yellow-900 font-bold">此產品需輸入丈量數據</h4><p className="text-sm text-yellow-700 mt-1">請準備好現場寬度與高度數據。</p></div></div>
                <button onClick={() => setIsMeasureOpen(true)} disabled={isSubmitting} className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70">{isSubmitting ? <Loader2 className="animate-spin" /> : <><Ruler className="w-5 h-5" /> 丈量並加入購物車</>}</button>
              </div>
            ) : (
              <button onClick={() => handleAddToCart()} disabled={isSubmitting} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md">{isSubmitting ? '處理中...' : '加入購物車'}</button>
            )}

            <MeasurementModal isOpen={isMeasureOpen} onClose={() => setIsMeasureOpen(false)} onConfirm={(data) => handleAddToCart(data)} />

            {/* 成功彈窗 */}
            {showSuccessModal && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2"><CheckCircle className="w-8 h-8" /></div>
                  <h3 className="text-xl font-bold text-gray-900">成功加入購物車！</h3>
                  <p className="text-sm text-gray-600">{product.name} {successMsg && <span className="block mt-1 font-medium text-orange-600">{successMsg}</span>}</p>
                  <div className="flex flex-col w-full gap-3 mt-2">
                    <button onClick={() => router.push('/cart')} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2">前往結帳</button>
                    <button onClick={() => setShowSuccessModal(false)} className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">繼續購物</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
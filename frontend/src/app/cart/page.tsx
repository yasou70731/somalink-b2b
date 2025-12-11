'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Trash2, ArrowRight, Loader2, ShoppingBag, AlertCircle, 
  Hammer, Package, MessageSquare, MapPin, Building2, 
  User, Phone, Copy, UploadCloud, FileText, X, Printer, Wallet 
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { api } from '@/lib/api';
// 引入 CartItem 型別
import type { CartItem } from '@/lib/api'; 
import Modal from '@/components/Modal'; 

const CLOUDINARY_CLOUD_NAME = 'dnibj8za6'; 
const CLOUDINARY_PRESET = 'yasou70731';  

// 定義 User 型別
interface UserProfile {
  dealerProfile?: {
    address?: string;
    contactPerson?: string;
    phone?: string;
    level?: string;         
    walletBalance?: number; 
  };
}

// 定義錯誤型別
interface ApiError {
  response?: {
    status?: number;
    data?: { message?: string };
  };
}

export default function CartPage() {
  const router = useRouter();
  const { items, removeFromCart, clearCart, cartTotal } = useCart();
  
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
    redirect: '' 
  });

  useEffect(() => {
    const token = localStorage.getItem('somalink_token') || sessionStorage.getItem('somalink_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    setAuthChecking(false);

    setMounted(true);
    const stored = localStorage.getItem('somalink_user') || sessionStorage.getItem('somalink_user');
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)); } catch { /* ignore error */ }
    }
  }, [router]);

  const [projectName, setProjectName] = useState('');
  const [shippingAddress, setShippingAddress] = useState(''); 
  const [siteContactPerson, setSiteContactPerson] = useState(''); 
  const [siteContactPhone, setSiteContactPhone] = useState(''); 
  const [customerNote, setCustomerNote] = useState(''); 
  
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 判斷是否顯示錢包 (僅限 A/B 級會員)
  const showWallet = currentUser?.dealerProfile && 
    (currentUser.dealerProfile.level === 'A' || currentUser.dealerProfile.level === 'B');

  const showAlert = (title: string, message: string, type: 'error' | 'success' | 'info' | 'warning' = 'error', redirect = '') => {
    setModalConfig({ isOpen: true, title, message, type, redirect });
  };

  const fillMemberInfo = () => {
    if (currentUser && currentUser.dealerProfile) {
      const { address, contactPerson, phone } = currentUser.dealerProfile;
      if (address) setShippingAddress(address);
      if (contactPerson) setSiteContactPerson(contactPerson);
      if (phone) setSiteContactPhone(phone);
    } else {
      showAlert('提示', '無法讀取會員資料，請確認您已登入。', 'info');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments = [...attachments];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_PRESET);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        
        const data = await res.json();
        if (data.secure_url) {
          newAttachments.push(data.secure_url);
        }
      }
      setAttachments(newAttachments);
    } catch (err) {
      console.error('上傳失敗', err);
      showAlert('上傳失敗', '部分檔案上傳失敗，請檢查網路或檔案大小。', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handlePrintQuotation = () => {
    if (!projectName.trim()) { showAlert('欄位未填', '請輸入案場名稱，以便顯示在報價單上', 'warning'); return; }
    
    const quotationData = {
      projectName,
      shippingAddress,
      siteContactPerson,
      siteContactPhone,
      items,
      totalAmount: cartTotal,
      createdAt: new Date().toISOString()
    };

    sessionStorage.setItem('soma_quotation_draft', JSON.stringify(quotationData));
    window.open('/quotation/preview', '_blank');
  };

  const handleSubmit = async () => {
    if (!projectName.trim()) { showAlert('欄位未填', '請輸入案場名稱', 'warning'); return; }
    if (!shippingAddress.trim()) { showAlert('欄位未填', '請輸入施工/送貨地址', 'warning'); return; }
    if (!siteContactPerson.trim()) { showAlert('欄位未填', '請輸入現場聯絡人', 'warning'); return; }
    if (!siteContactPhone.trim()) { showAlert('欄位未填', '請輸入現場電話', 'warning'); return; }
    if (!agreed) { showAlert('請同意條款', '請勾選「我已確認上述規格無誤，並同意服務條款」', 'warning'); return; }

    setIsSubmitting(true);

    try {
      const payload = {
        projectName,
        shippingAddress,
        siteContactPerson,
        siteContactPhone,
        customerNote,
        attachments,
        agreedToDisclaimer: agreed,
        // ✅ 修正：移除多餘的 any 和 eslint-disable
        items: items.map((item) => ({
          productId: item.productId,
          serviceType: item.serviceType,
          widthMatrix: item.widthMatrix,
          heightData: item.heightData,
          isCeilingMounted: item.isCeilingMounted,
          siteConditions: item.siteConditions,
          colorName: item.colorName,
          materialName: item.materialName,
          handleName: item.handleName,
          openingDirection: item.openingDirection,
          hasThreshold: item.hasThreshold,
          quantity: item.quantity,
          subtotal: item.subtotal,
          priceSnapshot: item.priceSnapshot
        }))
      };

      await api.post('/orders', payload);
      clearCart();
      
      showAlert('訂單已送出！', '您的訂單已成功建立，請至「歷史訂單」查看進度。', 'success', '/orders');

    } catch (error) {
      // ✅ 修正：標準錯誤處理
      const err = error as ApiError;
      console.error(err);
      if (err.response?.status === 401) {
        showAlert('權限錯誤', '請先登入會員後再試。', 'error', '/login');
      } else {
        showAlert('結帳失敗', '系統發生錯誤，請聯繫管理員。', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authChecking) return <div className="min-h-screen flex justify-center items-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" /></div>;
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
    <div className="min-h-screen bg-gray-50 py-12 relative">
      <Modal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          if (modalConfig.redirect) router.push(modalConfig.redirect);
        }}
        confirmText="確定"
      />

      {/* 懸浮錢包小工具 (固定在左下角，僅 A/B 級顯示) */}
      {showWallet && (
        <div className="fixed bottom-6 left-6 z-40 bg-gray-900 text-white px-5 py-3 rounded-full shadow-2xl border border-gray-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 hover:scale-105 transition-transform cursor-default">
          <div className="bg-blue-600 p-1.5 rounded-full">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">Wallet Balance</span>
            <span className="text-sm font-bold font-mono">
              ${Number(currentUser?.dealerProfile?.walletBalance || 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">確認訂單內容</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* 左側：商品列表 */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item: CartItem) => (
              // ✅ 修正：移除多餘的 any 強制轉型，CartItem 已經包含了所需欄位
              <div key={item.internalId} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row gap-6 relative group">
                <button 
                  onClick={() => removeFromCart(item.internalId)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="w-24 h-24 bg-gray-100 rounded-xl shrink-0 overflow-hidden relative">
                   <Image 
                     src="https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=200" 
                     alt={item.productName || 'product'} 
                     fill
                     className="object-cover"
                     sizes="96px"
                   />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{item.productName}</h3>
                    {item.serviceType === 'material' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200"><Package className="w-3 h-3" /> 純材料</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100"><Hammer className="w-3 h-3" /> 連工帶料</span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">規格：</span>{item.colorName} / {item.materialName} / {item.handleName || '無把手'} / {item.openingDirection}</p>
                    {/* ✅ 修正：安全讀取 JsonObject 類型的欄位 */}
                    <p><span className="font-medium">尺寸：</span>W {item.widthMatrix.mid}cm x H {(item.heightData as any).singleValue || (item.heightData as any).mid || 'N/A'}cm {item.isCeilingMounted && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">封頂</span>}</p>
                    {(item.siteConditions as any)?.floor && <p className="text-orange-600 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> 地面水平誤差: {(item.siteConditions as any).floor.diff}cm</p>}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-blue-600">${item.subtotal.toLocaleString()}</span>
                      <span className="text-xs text-gray-400">({item.serviceType === 'material' ? '材料買斷價' : '含工資打包價'})</span>
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
              
              {showWallet && (
                <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-blue-800 flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> 錢包餘額
                  </span>
                  <span className="text-lg font-bold text-blue-700">
                    ${Number(currentUser?.dealerProfile?.walletBalance || 0).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600"><span>商品總數</span><span>{items.length} 件</span></div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-4 border-t border-gray-100"><span>總金額</span><span>${cartTotal.toLocaleString()}</span></div>
              </div>

              <div className="mb-6 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">收貨與聯絡資訊</span>
                <button onClick={fillMemberInfo} className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1 transition-colors"><Copy className="w-3 h-3" /> 同會員資料</button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1"><Building2 className="w-3.5 h-3.5" /> 案場名稱 *</label>
                  <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="例：台北帝寶 A 棟" className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1"><MapPin className="w-3.5 h-3.5" /> 施工/送貨地址 *</label>
                  <input type="text" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="完整地址" className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1"><User className="w-3.5 h-3.5" /> 現場聯絡人 *</label>
                    <input type="text" value={siteContactPerson} onChange={(e) => setSiteContactPerson(e.target.value)} placeholder="王先生" className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1"><Phone className="w-3.5 h-3.5" /> 現場電話 *</label>
                    <input type="tel" value={siteContactPhone} onChange={(e) => setSiteContactPhone(e.target.value)} placeholder="0912..." className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2"><UploadCloud className="w-3.5 h-3.5" /> 附件上傳 (現場照/CAD圖) 選填</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {attachments.map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden relative">
                        {url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                          <Image src={url} alt="attachment" fill className="object-cover" sizes="48px" />
                        ) : (
                          <FileText className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <button onClick={() => removeAttachment(index)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                  <label className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors">
                    {isUploading ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> : <UploadCloud className="w-5 h-5 text-gray-400" />}
                    <input type="file" multiple onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                  </label>
                </div>
                <p className="text-xs text-gray-400">支援圖片與 PDF，單檔請勿超過 10MB。</p>
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2"><MessageSquare className="w-3.5 h-3.5" /> 訂單備註 (選填)</label>
                <textarea value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} placeholder="其他需求..." className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none text-sm" />
              </div>

              <label className="flex items-start gap-3 mb-6 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                <span className="text-sm text-gray-600 leading-relaxed">我已確認上述規格無誤，並同意服務條款。</span>
              </label>

              <div className="space-y-3">
                <button 
                  onClick={handlePrintQuotation}
                  className="w-full py-3 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" /> 下載 / 列印報價單
                </button>

                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting} 
                  className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <>確認下單 <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation'; 
import { api } from '@/lib/api';
import { Loader2, Printer, MapPin, Phone, User, MessageSquare } from 'lucide-react';

export default function PrintDeliveryNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter(); 
  const [order, setOrder] = useState<any>(null);
  const [showPrice, setShowPrice] = useState(true); 
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = searchParams.get('t');
      if (tokenFromUrl) {
        sessionStorage.setItem('somalink_token', tokenFromUrl);
      }
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    api.get(`/orders/${id}`)
      .then(res => setOrder(res))
      .catch(err => {
        console.error(err);
        if (err.response?.status === 401) {
          alert('您的登入憑證已過期或無效，請重新登入。');
          router.push('/login'); 
        }
      });
  }, [id, isReady, router]);

  if (!order) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
      
      {/* 控制列 (列印時隱藏) */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={showPrice} 
              onChange={(e) => setShowPrice(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer" 
            />
            <span className="text-sm text-gray-700 font-medium">顯示金額</span>
          </label>
          <span className="text-xs text-gray-400">| (給司機或現場看的單據可取消勾選)</span>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" /> 列印 / 存為 PDF
        </button>
      </div>

      {/* A4 紙張區域 
          ✨ 修改 1: 移除 min-h-[297mm]，改用 min-h-screen 或 auto，並在 print 時設為 h-auto
          ✨ 修改 2: 移除 flex flex-col，改用 block 讓內容自然流動
      */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none p-8 print:p-6 text-black font-sans relative box-border print:h-auto print:min-h-0">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black text-white flex items-center justify-center text-2xl font-bold rounded-lg print:border print:border-black">S</div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-wider text-black">出貨單</h1>
              <p className="text-sm font-bold mt-1 text-black">松成有限公司</p>
              <div className="flex gap-4 text-xs text-black font-medium mt-0.5">
                <span>統編：12345678</span>
                <span>電話：(02) 2345-6789</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block border-2 border-black px-3 py-1 rounded mb-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-black">出貨單號 NO.</p>
              <p className="text-lg font-mono font-bold text-black leading-none">{order.orderNumber}</p>
            </div>
            <p className="text-xs mt-1 text-black font-medium">列印日期：{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* 客戶與送貨資訊 */}
        <div className="grid grid-cols-2 gap-4 mb-4 break-inside-avoid">
          
          <div className="border-2 border-black rounded p-3">
            <h3 className="text-xs font-bold bg-gray-200 px-2 py-0.5 mb-2 inline-block rounded text-black print:border print:border-black">訂購經銷商 (Bill To)</h3>
            <div className="space-y-0.5 text-sm text-black">
              <p><span className="font-bold w-16 inline-block">公司名稱：</span><span className="font-bold">{order.user?.dealerProfile?.companyName}</span></p>
              <p><span className="font-bold w-16 inline-block">聯絡人：</span>{order.user?.dealerProfile?.contactPerson}</p>
              <p><span className="font-bold w-16 inline-block">電話：</span>{order.user?.dealerProfile?.phone}</p>
            </div>
          </div>

          <div className="border-2 border-black rounded p-3">
            <h3 className="text-xs font-bold bg-gray-200 px-2 py-0.5 mb-2 inline-block rounded text-black print:border print:border-black">送貨資訊 (Ship To)</h3>
            <div className="space-y-0.5 text-sm text-black">
              <div className="mb-1">
                <p className="text-[10px] font-bold text-black">案場名稱</p>
                <p className="font-bold text-base leading-tight">{order.projectName}</p>
              </div>
              
              <div className="flex items-start gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-black shrink-0" />
                <span className="font-bold border-b border-black pb-0 text-sm leading-tight">
                  {order.shippingAddress || '未指定地址 (同經銷商)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 text-xs">
                <p className="flex items-center font-medium">
                  <User className="w-3 h-3 mr-1 text-black" /> 
                  {order.siteContactPerson || order.user?.dealerProfile?.contactPerson}
                </p>
                <p className="flex items-center font-medium">
                  <Phone className="w-3 h-3 mr-1 text-black" /> 
                  {order.siteContactPhone || order.user?.dealerProfile?.phone}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 訂單備註 */}
        {order.customerNote && (
          <div className="mb-4 border-2 border-black bg-gray-50 p-2 rounded text-sm flex items-start gap-2 break-inside-avoid">
            <MessageSquare className="w-4 h-4 text-black mt-0.5 shrink-0" />
            <div className="text-black">
              <span className="font-bold mr-2">訂單備註：</span>
              <span className="font-medium">{order.customerNote}</span>
            </div>
          </div>
        )}

        {/* 產品明細 - ✨ 修改 3: 移除 flex-1，讓它自然佔用高度 */}
        <div className="mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 border-y-2 border-black text-xs text-black">
                <th className="py-1 px-2 text-left w-8 font-bold">#</th>
                <th className="py-1 px-2 text-left font-bold">產品名稱 / 詳細規格</th>
                <th className="py-1 px-2 text-center w-16 font-bold">數量</th>
                {showPrice && <th className="py-1 px-2 text-right w-24 font-bold">單價</th>}
                {showPrice && <th className="py-1 px-2 text-right w-24 font-bold">金額</th>}
              </tr>
            </thead>
            <tbody className="text-sm text-black">
              {order.items?.map((item: any, index: number) => (
                <tr key={index} className="border-b border-black break-inside-avoid">
                  <td className="py-2 px-2 align-top font-bold text-center">{index + 1}</td>
                  <td className="py-2 px-2 align-top">
                    <p className="font-bold text-sm">{item.product?.name}</p>
                    <div className="text-black text-[10px] mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono font-medium">
                      <p>型號: {item.product?.sku}</p>
                      <p>顏色: {item.colorName}</p>
                      <p>材質: {item.materialName}</p>
                      <p>開向: {item.openingDirection}</p>
                      <p>模式: {item.serviceType === 'assembled' ? '連工帶料' : '純材料'}</p>
                      {item.handleName && <p className="col-span-2 font-bold text-blue-900">把手: {item.handleName}</p>}
                    </div>
                    <div className="mt-1 bg-white px-1.5 py-0.5 rounded inline-block text-[10px] font-mono border border-black font-bold">
                      W: {item.widthMatrix?.mid} x H: {item.heightData?.singleValue || item.heightData?.mid}
                      {item.isCeilingMounted && <span className="ml-1 text-black font-extrabold">(封頂)</span>}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center align-top font-bold">{item.quantity}</td>
                  {showPrice && <td className="py-2 px-2 text-right align-top font-mono font-medium">${Number(item.unitPrice || item.subtotal / item.quantity).toLocaleString()}</td>}
                  {showPrice && <td className="py-2 px-2 text-right align-top font-bold font-mono">${Number(item.subtotal).toLocaleString()}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 總計與簽名 - ✨ 修改 4: 確保跟隨內容，不被推到底部 */}
        <div className="break-inside-avoid">
          {showPrice && (
            <div className="flex justify-end mb-6 border-t-2 border-black pt-2">
              <div className="text-right">
                <p className="text-xs font-bold text-black">總計金額 (含稅)</p>
                <p className="text-2xl font-extrabold text-black">NT$ {Number(order.totalAmount).toLocaleString()}</p>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-dashed border-gray-400">
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <p className="text-xs font-bold mb-6 text-black">倉管備貨</p>
                <div className="border-b-2 border-black w-3/4 mx-auto"></div>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold mb-6 text-black">司機配送</p>
                <div className="border-b-2 border-black w-3/4 mx-auto"></div>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold mb-6 text-black">客戶簽收</p>
                <div className="border-b-2 border-black w-3/4 mx-auto"></div>
                <p className="text-[9px] text-black font-bold mt-1">本人確認上述規格與數量無誤</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
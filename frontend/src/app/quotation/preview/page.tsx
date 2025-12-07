'use client';

import { useEffect, useState } from 'react';
import { Loader2, Printer, MapPin, Phone, User, MessageSquare, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QuotationPreviewPage() {
  const router = useRouter();
  const [cartData, setCartData] = useState<any>(null);
  const [showPrice, setShowPrice] = useState(true);

  useEffect(() => {
    // 從 SessionStorage 讀取暫存的報價資料
    const data = sessionStorage.getItem('soma_quotation_draft');
    if (data) {
      setCartData(JSON.parse(data));
    } else {
      alert('無報價資料，請從購物車重新操作');
      window.close(); // 或 router.push('/cart');
    }
  }, []);

  if (!cartData) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
      
      {/* 控制列 */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-blue-800 flex items-center gap-2"><FileText className="w-5 h-5"/> 報價單預覽</span>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" /> 列印 / 存為 PDF
        </button>
      </div>

      {/* A4 紙張 */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none p-8 print:p-6 text-black font-sans relative box-border print:h-auto print:min-h-0">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black text-white flex items-center justify-center text-2xl font-bold rounded-lg print:border print:border-black">S</div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-wider text-black">正式報價單</h1>
              <p className="text-sm font-bold mt-1 text-black">松成有限公司</p>
              <div className="flex gap-4 text-xs text-black font-medium mt-0.5">
                <span>統編：12345678</span>
                <span>電話：(02) 2345-6789</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block border-2 border-black px-3 py-1 rounded mb-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-black">QUOTATION</p>
              <p className="text-lg font-mono font-bold text-black leading-none">{new Date().toISOString().slice(0,10).replace(/-/g,'')}-TEMP</p>
            </div>
            <p className="text-xs mt-1 text-black font-medium">報價日期：{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* 客戶資訊 */}
        <div className="border-2 border-black rounded p-3 mb-4">
          <h3 className="text-xs font-bold bg-gray-200 px-2 py-0.5 mb-2 inline-block rounded text-black print:border print:border-black">客戶資訊 (Customer)</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-black">
             <div>
                <p><span className="font-bold w-16 inline-block">案場名稱：</span>{cartData.projectName}</p>
                <p><span className="font-bold w-16 inline-block">送貨地址：</span>{cartData.shippingAddress}</p>
             </div>
             <div>
                <p><span className="font-bold w-16 inline-block">聯絡人：</span>{cartData.siteContactPerson}</p>
                <p><span className="font-bold w-16 inline-block">電話：</span>{cartData.siteContactPhone}</p>
             </div>
          </div>
        </div>

        {/* 產品明細 */}
        <div className="mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 border-y-2 border-black text-xs text-black">
                <th className="py-1 px-2 text-left w-8 font-bold">#</th>
                <th className="py-1 px-2 text-left font-bold">產品名稱 / 詳細規格</th>
                <th className="py-1 px-2 text-center w-16 font-bold">數量</th>
                <th className="py-1 px-2 text-right w-24 font-bold">單價</th>
                <th className="py-1 px-2 text-right w-24 font-bold">金額</th>
              </tr>
            </thead>
            <tbody className="text-sm text-black">
              {cartData.items?.map((item: any, index: number) => (
                <tr key={index} className="border-b border-black break-inside-avoid">
                  <td className="py-2 px-2 align-top font-bold text-center">{index + 1}</td>
                  <td className="py-2 px-2 align-top">
                    <p className="font-bold text-sm">{item.productName}</p>
                    <div className="text-black text-[10px] mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono font-medium">
                      <p>規格: {item.colorName} / {item.materialName}</p>
                      <p>模式: {item.serviceType === 'assembled' ? '連工帶料' : '純材料'}</p>
                      {item.handleName && <p className="col-span-2">把手: {item.handleName}</p>}
                    </div>
                    <div className="mt-1 bg-white px-1.5 py-0.5 rounded inline-block text-[10px] font-mono border border-black font-bold">
                      W: {item.widthMatrix?.mid} x H: {item.heightData?.singleValue || item.heightData?.mid}
                      {item.isCeilingMounted && <span className="ml-1 text-black font-extrabold">(封頂)</span>}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center align-top font-bold">{item.quantity}</td>
                  <td className="py-2 px-2 text-right align-top font-mono font-medium">${Number(item.unitPrice).toLocaleString()}</td>
                  <td className="py-2 px-2 text-right align-top font-bold font-mono">${Number(item.subtotal).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 總計 */}
        <div className="break-inside-avoid">
          <div className="flex justify-end mb-6 border-t-2 border-black pt-2">
            <div className="text-right">
              <p className="text-xs font-bold text-black">報價總金額 (未稅)</p>
              <p className="text-2xl font-extrabold text-black">NT$ {Number(cartData.totalAmount).toLocaleString()}</p>
              <p className="text-[10px] text-gray-500 mt-1">* 此報價單有效期為 7 天，最終價格以實際下單為準。</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
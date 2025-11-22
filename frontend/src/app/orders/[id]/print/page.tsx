'use client';

import { useEffect, useState, use } from 'react';
import { api } from '@/lib/api'; // 如果後台可以用 @，就維持這樣；如果報錯，請改用相對路徑
import { Loader2, Printer, MapPin, Phone, User, AlertTriangle, Ruler } from 'lucide-react';

export default function PrintDeliveryNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [showPrice, setShowPrice] = useState(true); 

  useEffect(() => {
    api.get(`/orders/${id}`).then(res => setOrder(res.data)).catch(console.error);
  }, [id]);

  if (!order) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
      
      {/* 控制列 */}
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

      {/* A4 紙張區域 */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none p-[15mm] min-h-[297mm] text-black font-sans relative flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-black text-white flex items-center justify-center text-2xl font-bold rounded-lg">S</div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-wider text-black">出貨單</h1>
              <p className="text-sm font-bold mt-1">松成有限公司</p>
              <p className="text-xs text-gray-600">統編：12345678</p>
              <p className="text-xs text-gray-600">電話：(02) 2345-6789</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block border-2 border-black px-4 py-2 rounded mb-2">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">出貨單號 NO.</p>
              <p className="text-xl font-mono font-bold">{order.orderNumber}</p>
            </div>
            <p className="text-sm mt-1 text-gray-600">列印日期：{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* 客戶與送貨資訊 */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="border border-gray-300 rounded p-4">
            <h3 className="text-sm font-bold bg-gray-100 px-2 py-1 mb-2 inline-block rounded text-gray-700">訂購經銷商 (Bill To)</h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-500 w-16 inline-block">公司名稱：</span><span className="font-bold">{order.user?.dealerProfile?.companyName}</span></p>
              <p><span className="text-gray-500 w-16 inline-block">聯絡人：</span>{order.user?.dealerProfile?.contactPerson}</p>
              <p><span className="text-gray-500 w-16 inline-block">電話：</span>{order.user?.dealerProfile?.phone}</p>
            </div>
          </div>
          <div className="border border-gray-300 rounded p-4">
            <h3 className="text-sm font-bold bg-gray-100 px-2 py-1 mb-2 inline-block rounded text-gray-700">送貨資訊 (Ship To)</h3>
            <div className="space-y-1 text-sm">
              <p className="flex items-start"><MapPin className="w-4 h-4 mr-1 mt-0.5 text-gray-400" /><span className="font-bold text-lg">{order.projectName || '未填寫案場名'}</span></p>
              <p className="flex items-center mt-1"><User className="w-4 h-4 mr-1 text-gray-400" /> {order.siteContactPerson || order.user?.dealerProfile?.contactPerson || '同訂購人'}</p>
              <p className="flex items-center"><Phone className="w-4 h-4 mr-1 text-gray-400" /> {order.siteContactPhone || order.user?.dealerProfile?.phone}</p>
            </div>
          </div>
        </div>

        {/* 產品明細 */}
        <table className="w-full mb-6 border-collapse">
          <thead>
            <tr className="bg-gray-100 border-y-2 border-black text-sm">
              <th className="py-2 px-4 text-left w-12">#</th>
              <th className="py-2 px-4 text-left">產品名稱 / 詳細規格</th>
              <th className="py-2 px-4 text-center w-24">數量</th>
              {showPrice && <th className="py-2 px-4 text-right w-32">單價</th>}
              {showPrice && <th className="py-2 px-4 text-right w-32">金額</th>}
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 align-top">1</td>
              <td className="py-4 px-4 align-top">
                <p className="font-bold text-base">{order.product?.name}</p>
                <div className="text-gray-600 text-xs mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
                  <p>型號: {order.product?.sku}</p>
                  <p>顏色: {order.colorName}</p>
                  <p>材質: {order.materialName}</p>
                  <p>開向: {order.openingDirection}</p>
                  <p>模式: {order.serviceType === 'assembled' ? '成品含代工' : '純材料'}</p>
                </div>
              </td>
              <td className="py-4 px-4 text-center align-top font-bold">1 套</td>
              {showPrice && <td className="py-4 px-4 text-right align-top font-mono">${Number(order.totalAmount).toLocaleString()}</td>}
              {showPrice && <td className="py-4 px-4 text-right align-top font-bold font-mono">${Number(order.totalAmount).toLocaleString()}</td>}
            </tr>
          </tbody>
        </table>

        {/* 丈量數據 */}
        <div className="mb-8 border-2 border-gray-800 rounded-lg overflow-hidden">
          <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Ruler className="w-4 h-4" /> 原始丈量數據確認 (Verification Data)
            </h3>
            <span className="text-xs opacity-80">單位：mm</span>
          </div>
          
          <div className="p-4 grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-bold text-gray-500 text-center mb-2 uppercase">寬度矩陣 (Width)</p>
              <div className="grid grid-cols-3 border border-gray-300 text-center text-sm">
                <div className="bg-gray-100 p-1 border-r border-b border-gray-300 text-xs">上</div>
                <div className="bg-gray-100 p-1 border-r border-b border-gray-300 text-xs">中</div>
                <div className="bg-gray-100 p-1 border-b border-gray-300 text-xs">下</div>
                <div className="p-2 border-r border-gray-300 font-mono font-bold">{order.widthMatrix?.top}</div>
                <div className="p-2 border-r border-gray-300 font-mono font-bold">{order.widthMatrix?.mid}</div>
                <div className="p-2 font-mono font-bold">{order.widthMatrix?.bot}</div>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 text-center mb-2 uppercase">高度矩陣 (Height)</p>
              {order.heightData?.singleValue ? (
                <div className="border border-gray-300 p-2 text-center bg-gray-50">
                  <span className="text-xs text-gray-500">不封頂實高：</span>
                  <span className="font-bold font-mono text-lg ml-2">{order.heightData.singleValue}</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 border border-gray-300 text-center text-sm">
                  <div className="bg-gray-100 p-1 border-r border-b border-gray-300 text-xs">左</div>
                  <div className="bg-gray-100 p-1 border-r border-b border-gray-300 text-xs">中</div>
                  <div className="bg-gray-100 p-1 border-r border-b border-gray-300 text-xs">右</div>
                  <div className="p-2 border-r border-gray-300 font-mono font-bold">{order.heightData?.left}</div>
                  <div className="p-2 border-r border-gray-300 font-mono font-bold">{order.heightData?.mid}</div>
                  <div className="p-2 font-mono font-bold">{order.heightData?.right}</div>
                </div>
              )}
            </div>
          </div>

          {order.siteConditions?.floor && (
            <div className="mx-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded flex items-start gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800">⚠️ 地面水平有高低差</p>
                <p className="text-amber-700 text-xs mt-1 font-mono">
                  左: {order.siteConditions.floor.left} / 中: {order.siteConditions.floor.mid} / 右: {order.siteConditions.floor.right}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 總計 */}
        {showPrice && (
          <div className="flex justify-end mb-12 border-t-2 border-black pt-4">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-600">總計金額 (含稅)</p>
              <p className="text-3xl font-bold text-black">NT$ {Number(order.totalAmount).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* 底部 */}
        <div className="mt-auto">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-sm font-bold mb-8">倉管備貨</p>
              <div className="border-b border-black w-2/3 mx-auto"></div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold mb-8">司機配送</p>
              <div className="border-b border-black w-2/3 mx-auto"></div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold mb-8">客戶簽收</p>
              <div className="border-b border-black w-2/3 mx-auto"></div>
              <p className="text-[10px] text-gray-400 mt-1">本人確認上述規格與丈量數據無誤</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { X, CheckCircle, Ruler, Info, Loader2, Printer, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void; 
}

export default function OrderDetailModal({ order, isOpen, onClose, onUpdate }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [note, setNote] = useState('');

  if (!isOpen || !order) return null;

  const handleReview = async (status: 'processing' | 'cancelled') => {
    const actionText = status === 'processing' ? '批准生產' : '退回訂單';
    if (!confirm(`確定要【${actionText}】嗎？\n單號：${order.orderNumber}`)) return;
    
    setIsLoading(true);
    try {
      await api.patch(`/orders/${order.id}/status`, { status, adminNote: note || undefined });
      alert('操作成功！');
      onUpdate(); 
      onClose();
    } catch (err) {
      console.error(err);
      alert('操作失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // ✨ 開啟出貨單列印頁面
  const openPrintPage = () => {
    // 開啟新視窗
    window.open(`/orders/${order.id}/print`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              訂單審核 
              <span className="text-sm font-normal text-gray-500 bg-white border px-2 py-0.5 rounded font-mono">
                {order.orderNumber}
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              經銷商：{order.user?.dealerProfile?.companyName || order.user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            {/* ✨ 新增列印按鈕 */}
            <button 
              onClick={openPrintPage}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
              title="列印出貨單"
            >
              <Printer className="w-4 h-4" />
              列印出貨單
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* 1. 產品規格 */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">產品規格</h3>
            <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm border border-gray-100">
              <div><span className="text-gray-500 block text-xs mb-1">產品名稱</span><span className="font-bold text-gray-900">{order.product?.name}</span></div>
              <div><span className="text-gray-500 block text-xs mb-1">交易模式</span><span className="font-bold text-gray-900">{order.serviceType === 'assembled' ? '含代工' : '純材料'}</span></div>
              <div><span className="text-gray-500 block text-xs mb-1">總金額</span><span className="font-bold text-blue-600">${Number(order.totalAmount).toLocaleString()}</span></div>
              <div><span className="text-gray-500 block text-xs mb-1">顏色</span>{order.colorName}</div>
              <div><span className="text-gray-500 block text-xs mb-1">材質</span>{order.materialName}</div>
              <div><span className="text-gray-500 block text-xs mb-1">開向</span>{order.openingDirection}</div>
            </div>
          </section>

          {/* 2. 丈量數據 */}
          <section>
            <h3 className="text-xs font-bold text-blue-600 uppercase mb-3 flex items-center gap-2 tracking-wider">
              <Ruler className="w-4 h-4" /> 現場丈量數據 (mm)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 寬度 */}
              <div className="border border-blue-100 bg-blue-50/30 rounded-lg p-4">
                <p className="text-xs font-bold text-gray-500 text-center mb-3">寬度矩陣 (Width)</p>
                <div className="flex justify-between items-center gap-2">
                  {['top', 'mid', 'bot'].map(pos => (
                    <div key={pos} className="flex-1 text-center p-2 bg-white rounded border border-blue-100 shadow-sm">
                      <div className="text-[10px] text-blue-400 uppercase font-bold">{pos}</div>
                      <div className="font-mono font-bold text-lg text-blue-900">{order.widthMatrix?.[pos] || '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* 高度 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-bold text-gray-500 text-center mb-3">高度矩陣 (Height)</p>
                {order.heightData?.singleValue ? (
                   <div className="text-center p-3 bg-gray-100 rounded border border-gray-200">
                     <span className="text-xs text-gray-500 block mb-1">不封頂實高</span>
                     <span className="font-bold text-lg font-mono">{order.heightData.singleValue}</span>
                   </div>
                ) : (
                  <div className="flex justify-between items-center gap-2">
                    {['left', 'mid', 'right'].map(pos => (
                      <div key={pos} className="flex-1 text-center p-2 bg-gray-50 rounded border border-gray-200">
                        <div className="text-[10px] text-gray-400 uppercase font-bold">{pos}</div>
                        <div className="font-mono font-bold text-lg text-gray-700">{order.heightData?.[pos] || '-'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {order.siteConditions?.floor && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex gap-4 items-center">
                {/* ✨ 修正處：將 flex-shrink-0 改為 shrink-0 */}
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">⚠️ 注意：地面有水平高低差</span>
                  <span className="font-mono text-xs mt-1 block opacity-80">
                    左:{order.siteConditions.floor.left} / 中:{order.siteConditions.floor.mid} / 右:{order.siteConditions.floor.right}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* 3. 備註 */}
          <section>
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">審核備註 / 給工廠的話</label>
            <textarea 
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              rows={3}
              placeholder="例如：已確認尺寸無誤..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between items-center">
          <div className="text-sm text-gray-500">
            目前狀態：<span className="font-bold text-gray-900 uppercase">{order.status}</span>
          </div>
          
          {order.status === 'pending' ? (
            <div className="flex gap-3">
              <button onClick={() => handleReview('cancelled')} disabled={isLoading} className="px-5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors disabled:opacity-50">退回訂單</button>
              <button onClick={() => handleReview('processing')} disabled={isLoading} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md flex items-center gap-2 disabled:opacity-50">
                {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />} 批准生產
              </button>
            </div>
          ) : (
            <button disabled className="px-6 py-2.5 text-sm font-bold text-gray-400 bg-gray-200 rounded-lg cursor-not-allowed">已完成審核</button>
          )}
        </div>

      </div>
    </div>
  );
}
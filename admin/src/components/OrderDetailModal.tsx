'use client';

import { X, Printer, Package, Ruler, AlertCircle, Trash2, Hammer, MessageSquare, Truck, CheckCircle } from 'lucide-react';
import { Order, api } from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: () => void;
}

export default function OrderDetailModal({ order, isOpen, onClose, onStatusUpdate }: OrderDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !order) return null;

  // 處理狀態變更 (核心邏輯)
  const handleStatusChange = async (newStatus: string) => {
    // 根據不同狀態顯示更明確的確認訊息
    let confirmMsg = `確定要將狀態變更為 ${newStatus} 嗎？`;
    
    if (newStatus === 'processing') {
      confirmMsg = `✅ 審核通過確認\n\n確定接受此訂單並開始生產？`;
    } else if (newStatus === 'shipped') {
      confirmMsg = `🚚 出貨確認\n\n確定將訂單標記為「已出貨」？\n系統將會發送 Email 通知客戶。`;
    } else if (newStatus === 'completed') {
      confirmMsg = `🎉 完工結案\n\n確定將訂單標記為「已完成」？`;
    }

    if (!confirm(confirmMsg)) return;
    
    setIsUpdating(true);
    try {
      await api.patch(`/orders/${order.id}/status`, { status: newStatus });
      onStatusUpdate(); // 通知外層列表更新
      onClose();        // 關閉視窗
    } catch (error) {
      console.error(error);
      alert('更新失敗，請檢查網路或權限');
    } finally {
      setIsUpdating(false);
    }
  };

  // 處理刪除訂單
  const handleDelete = async () => {
    if (!confirm(`⚠️ 危險操作！\n\n確定要「永久刪除」這張訂單嗎？\n刪除後無法復原！`)) return;
    
    setIsUpdating(true);
    try {
      await api.delete(`/orders/${order.id}`);
      alert('訂單已刪除');
      onStatusUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      alert('刪除失敗，請稍後再試');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">{order.orderNumber}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold 
                ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                  order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'}`}>
                {typeof order.status === 'string' ? order.status.toUpperCase() : order.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              案場：{order.projectName} | 客戶：{order.user?.dealerProfile?.companyName || order.user?.name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content (可捲動區域) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* 1. 訂單摘要卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
               <span className="text-sm text-blue-600 block mb-1 font-medium">訂單總金額</span>
               <span className="text-2xl font-bold text-blue-900">${Number(order.totalAmount).toLocaleString()}</span>
             </div>
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
               <span className="text-sm text-gray-500 block mb-1 font-medium">下單時間</span>
               <span className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleString('zh-TW')}</span>
             </div>
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
               <span className="text-sm text-gray-500 block mb-1 font-medium">聯絡電話</span>
               <span className="font-medium text-gray-900">{order.user?.dealerProfile?.phone || 'N/A'}</span>
             </div>
          </div>

          {/* 2. 客戶備註 (如果有填寫) */}
          {order.customerNote && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-bold text-amber-800 block mb-1">客戶備註：</span>
                <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{order.customerNote}</p>
              </div>
            </div>
          )}

          {/* 3. 商品明細表格 */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" /> 訂購品項 ({order.items?.length || 0})
            </h3>
            
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                  <tr>
                    <th className="px-4 py-3">產品資訊</th>
                    <th className="px-4 py-3">尺寸 (寬x高)</th>
                    <th className="px-4 py-3">規格細節</th>
                    <th className="px-4 py-3">特殊需求</th>
                    <th className="px-4 py-3 text-right">小計</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items?.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{item.product?.name || '未知產品'}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {item.serviceType === 'material' ? (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded flex items-center gap-1">
                              <Package className="w-3 h-3" /> 純材料
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded flex items-center gap-1">
                              <Hammer className="w-3 h-3" /> 連工帶料
                            </span>
                          )}
                          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">x{item.quantity}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded w-fit">
                          <Ruler className="w-3 h-3" />
                          {item.widthMatrix.mid} x {item.heightData.singleValue || item.heightData.mid}
                        </div>
                        {item.isCeilingMounted && <span className="text-xs text-green-600 mt-1 block font-medium">✔ 封頂安裝</span>}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        <div>{item.colorName}</div>
                        <div>{item.materialName}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{item.openingDirection}</div>
                      </td>
                      <td className="px-4 py-4 text-gray-500">
                         {item.siteConditions?.floor && (
                           <div className="flex items-center gap-1 text-orange-600 text-xs font-medium bg-orange-50 px-2 py-1 rounded w-fit">
                             <AlertCircle className="w-3 h-3" /> 地面誤差 {item.siteConditions.floor.diff}cm
                           </div>
                         )}
                         {!item.siteConditions?.floor && '-'}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-gray-900">
                        ${Number(item.subtotal).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. 管理員備註區 */}
          {order.adminNote && (
             <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-yellow-800 text-sm">
               <strong>管理員備註：</strong> {order.adminNote}
             </div>
          )}

        </div>

        {/* Footer Actions (底部操作列) */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center gap-3">
           
           {/* 左側：通用功能 */}
           <div className="flex items-center gap-3">
             <Link 
               href={`/orders/${order.id}/print`} 
               target="_blank"
               className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium flex items-center gap-2 shadow-sm"
             >
               <Printer className="w-4 h-4" /> 列印工單
             </Link>
             <button 
                onClick={handleDelete}
                disabled={isUpdating}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 font-medium flex items-center gap-2 transition-colors"
             >
               <Trash2 className="w-4 h-4" /> 刪除
             </button>
           </div>

           {/* 右側：狀態流轉按鈕 (根據狀態顯示不同按鈕) */}
           <div className="flex gap-2">
             
             {/* 1. 待審核 -> 審核通過 */}
             {order.status === 'pending' && (
               <>
                 <button 
                   onClick={() => handleStatusChange('cancelled')}
                   disabled={isUpdating}
                   className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition-colors"
                 >
                   拒絕
                 </button>
                 <button 
                   onClick={() => handleStatusChange('processing')}
                   disabled={isUpdating}
                   className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md flex items-center gap-2 transition-colors"
                 >
                   <CheckCircle className="w-4 h-4" /> 審核通過
                 </button>
               </>
             )}

             {/* 2. 生產中 -> 安排出貨 (這就是您要的按鈕) */}
             {order.status === 'processing' && (
                <button 
                  onClick={() => handleStatusChange('shipped')}
                  disabled={isUpdating}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold shadow-md flex items-center gap-2 transition-colors"
                >
                  <Truck className="w-4 h-4" /> 安排出貨
                </button>
             )}

             {/* 3. 已出貨 -> 標記完工 */}
             {order.status === 'shipped' && (
                <button 
                  onClick={() => handleStatusChange('completed')}
                  disabled={isUpdating}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-md flex items-center gap-2 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> 標記為已完工
                </button>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
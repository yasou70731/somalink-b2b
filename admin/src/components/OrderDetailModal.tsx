'use client';

import { X, Printer, Package, Ruler, AlertCircle, Trash2, Hammer, MessageSquare, Truck } from 'lucide-react';
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

  // 處理狀態變更
  const handleStatusChange = async (newStatus: string) => {
    // 針對不同動作顯示不同的確認訊息
    let confirmMsg = `確定要將狀態變更為 ${newStatus} 嗎？`;
    
    if (newStatus === 'shipped') {
      confirmMsg = `🚚 準備出貨了嗎？\n\n確定將訂單標記為「已出貨」？系統將會發送通知給客戶。`;
    } else if (newStatus === 'completed') {
      confirmMsg = `✅ 訂單結案確認\n\n確定將訂單標記為「已完工」？`;
    }

    if (!confirm(confirmMsg)) return;
    
    setIsUpdating(true);
    try {
      await api.patch(`/orders/${order.id}/status`, { status: newStatus });
      onStatusUpdate(); // 通知父層列表更新
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* 頂部標題列 */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">{order.orderNumber}</h2>
              {/* 狀態標籤 */}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold 
                ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                  order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'}`}>
                {order.status.toUpperCase()}
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

        {/* 內容區 (可捲動) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* 1. 訂單摘要資訊 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
               <span className="text-sm text-blue-600 block mb-1">訂單總金額</span>
               <span className="text-2xl font-bold text-blue-900">${Number(order.totalAmount).toLocaleString()}</span>
             </div>
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
               <span className="text-sm text-gray-500 block mb-1">下單時間</span>
               <span className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleString('zh-TW')}</span>
             </div>
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
               <span className="text-sm text-gray-500 block mb-1">聯絡電話</span>
               <span className="font-medium text-gray-900">{order.user?.dealerProfile?.phone || 'N/A'}</span>
             </div>
          </div>

          {/* 2. 客戶備註 (如果有填寫才顯示) */}
          {order.customerNote && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <span className="text-sm font-bold text-blue-800 block mb-1">客戶備註：</span>
                <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{order.customerNote}</p>
              </div>
            </div>
          )}

          {/* 3. 商品列表 (支援多品項與服務模式顯示) */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" /> 訂購品項 ({order.items?.length || 0})
            </h3>
            
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                  <tr>
                    <th className="px-4 py-3">產品資訊</th>
                    <th className="px-4 py-3">製作尺寸</th>
                    <th className="px-4 py-3">規格細節</th>
                    <th className="px-4 py-3">特殊需求</th>
                    <th className="px-4 py-3 text-right">小計</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items?.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      {/* 產品資訊 */}
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
                          <span className="text-xs text-gray-400">x{item.quantity}</span>
                        </div>
                      </td>
                      {/* 尺寸 */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded w-fit">
                          <Ruler className="w-3 h-3" />
                          {item.widthMatrix.mid} x {item.heightData.singleValue || item.heightData.mid}
                        </div>
                        {item.isCeilingMounted && <span className="text-xs text-green-600 mt-1 block">✔ 封頂安裝</span>}
                      </td>
                      {/* 規格 */}
                      <td className="px-4 py-4 text-gray-600">
                        <div>{item.colorName}</div>
                        <div>{item.materialName}</div>
                        <div className="text-xs text-gray-400">{item.openingDirection}</div>
                      </td>
                      {/* 環境誤差 */}
                      <td className="px-4 py-4 text-gray-500">
                         {item.siteConditions?.floor && (
                           <div className="flex items-center gap-1 text-orange-600 text-xs">
                             <AlertCircle className="w-3 h-3" /> 地面誤差 {item.siteConditions.floor.diff}cm
                           </div>
                         )}
                         {!item.siteConditions?.floor && '-'}
                      </td>
                      {/* 小計 */}
                      <td className="px-4 py-4 text-right font-bold text-gray-900">
                        ${Number(item.subtotal).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. 管理員備註 */}
          {order.adminNote && (
             <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-yellow-800 text-sm">
               <strong>管理員備註：</strong> {order.adminNote}
             </div>
          )}

        </div>

        {/* 底部操作按鈕區 (Action Bar) */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center gap-3">
           
           {/* 左側通用功能 */}
           <div className="flex items-center gap-3">
             <Link 
               href={`/orders/${order.id}/print`} 
               target="_blank"
               className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium flex items-center gap-2"
             >
               <Printer className="w-4 h-4" /> 列印工單
             </Link>
             <button 
                onClick={handleDelete}
                disabled={isUpdating}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 font-medium flex items-center gap-2"
             >
               <Trash2 className="w-4 h-4" /> 刪除訂單
             </button>
           </div>

           {/* 右側狀態流轉按鈕 */}
           <div className="flex gap-2">
             {/* 狀態 1: 待審核 -> 取消 或 通過 */}
             {order.status === 'pending' && (
               <>
                 <button 
                   onClick={() => handleStatusChange('cancelled')}
                   disabled={isUpdating}
                   className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold"
                 >
                   拒絕 / 取消
                 </button>
                 <button 
                   onClick={() => handleStatusChange('processing')}
                   disabled={isUpdating}
                   className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm"
                 >
                   審核通過 (生產)
                 </button>
               </>
             )}

             {/* 狀態 2: 生產中 -> 安排出貨 (新增功能) */}
             {order.status === 'processing' && (
                <button 
                  onClick={() => handleStatusChange('shipped')}
                  disabled={isUpdating}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold shadow-sm flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" /> 安排出貨
                </button>
             )}

             {/* 狀態 3: 已出貨 -> 標記完工 */}
             {order.status === 'shipped' && (
                <button 
                  onClick={() => handleStatusChange('completed')}
                  disabled={isUpdating}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-sm"
                >
                  標記為已完工
                </button>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
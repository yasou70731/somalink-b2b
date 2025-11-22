'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Package, Clock, CheckCircle, ArrowRight, XCircle, CheckSquare, Info, Printer } from 'lucide-react';
import clsx from 'clsx';

interface Order {
  id: string;
  orderNumber: string;
  projectName: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  product?: { name: string };
  serviceType: string;
  totalAmount: string;
  widthMatrix: any;
  heightData: any;
  adminNote?: string;
}

const STATUS_MAP: Record<string, string> = {
  pending: '待審核',
  processing: '生產中',
  completed: '已完成',
  cancelled: '已取消',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data);
      } catch (err) {
        console.error('無法取得訂單', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">載入中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          我的訂單記錄
        </h1>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
              尚無訂單，快去選購吧！
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* 訂單 Header */}
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                  <div>
                    <span className="text-xs text-gray-500 font-mono">訂單編號: {order.orderNumber}</span>
                    <h3 className="text-sm font-bold text-gray-900 mt-1">{order.projectName || '未命名案場'}</h3>
                  </div>
                  
                  <div className={clsx(
                    "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                    order.status === 'pending' ? "bg-yellow-100 text-yellow-800" :
                    order.status === 'processing' ? "bg-blue-100 text-blue-800" :
                    order.status === 'completed' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  )}>
                    {order.status === 'pending' && <Clock className="w-3 h-3" />}
                    {order.status === 'processing' && <CheckCircle className="w-3 h-3" />}
                    {order.status === 'completed' && <CheckSquare className="w-3 h-3" />}
                    {order.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                    {STATUS_MAP[order.status] || order.status}
                  </div>
                </div>

                {/* 訂單內容 */}
                <div className="p-6 flex flex-col sm:flex-row gap-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-lg text-gray-800">{order.product?.name || '未知產品'}</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        {order.serviceType === 'assembled' ? '含代工' : '純材料'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="text-xs text-gray-400">寬度 (上/中/下)</p>
                        <p className="font-mono">{order.widthMatrix?.top} / {order.widthMatrix?.mid} / {order.widthMatrix?.bot}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">高度</p>
                        <p className="font-mono">
                          {order.heightData?.singleValue 
                            ? order.heightData.singleValue 
                            : `${order.heightData?.left} / ${order.heightData?.mid} / ${order.heightData?.right}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right min-w-[120px] flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-gray-400">總金額</p>
                      <p className="text-2xl font-bold text-blue-600">${Number(order.totalAmount).toLocaleString()}</p>
                    </div>
                    
                    {/* ✨ 這裡就是下載訂單按鈕 */}
                    <button 
                      onClick={() => window.open(`/orders/${order.id}/print`, '_blank')}
                      className="mt-4 flex items-center justify-end gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      下載/列印
                    </button>
                  </div>
                </div>
                
                {order.adminNote && (
                  <div className="bg-blue-50 px-6 py-2 text-xs text-blue-700 border-t border-blue-100 flex items-center gap-2">
                    <Info className="w-3 h-3" />
                    <span>系統備註: {order.adminNote}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
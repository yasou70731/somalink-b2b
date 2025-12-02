'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Clock, Truck, CheckCircle, Trash2, Hammer, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { useCart, CartItem } from '@/context/CartContext';

// 定義介面 (與 API 回傳一致)
interface OrderItem {
  product: { 
    id: string; 
    name: string; 
    basePrice?: number; 
    assemblyFee?: number;
  };
  quantity: number;
  serviceType: 'material' | 'assembled';
  widthMatrix: any;
  heightData: any;
  isCeilingMounted: boolean;
  siteConditions: any;
  colorName: string;
  materialName: string;
  handleName: string;
  openingDirection: string;
  hasThreshold: boolean;
  subtotal: number;
  priceSnapshot: any;
}

interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  projectName: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const { addToCart } = useCart(); 
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✨ 權限檢查狀態
  const [authChecking, setAuthChecking] = useState(true);

  // ✨ 彈窗狀態
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, orderId: '' });
  const [reorderModal, setReorderModal] = useState({ isOpen: false, order: null as Order | null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // ✨✨✨ 檢查是否登入 ✨✨✨
    const token = localStorage.getItem('somalink_token') || sessionStorage.getItem('somalink_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    setAuthChecking(false);

    const fetchOrders = async () => {
      try {
        const data = await api.get('/orders');
        setOrders(data);
      } catch (error) {
        console.error('Failed to fetch orders', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [router]);

  // --- 刪除邏輯 ---
  const confirmDelete = (orderId: string) => {
    setDeleteModal({ isOpen: true, orderId });
  };

  const handleDelete = async () => {
    if (!deleteModal.orderId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/orders/${deleteModal.orderId}`);
      setOrders((prev) => prev.filter((o) => o.id !== deleteModal.orderId));
    } catch (error) {
      console.error(error);
      alert('刪除失敗：可能訂單已進入生產流程，請聯繫客服。');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, orderId: '' });
    }
  };

  // --- 再次購買邏輯 ---
  const confirmReorder = (order: Order) => {
    setReorderModal({ isOpen: true, order });
  };

  const handleReorder = () => {
    const order = reorderModal.order;
    if (!order) return;

    order.items.forEach(item => {
      const cartItem: CartItem = {
        internalId: crypto.randomUUID(), 
        productId: item.product?.id,     
        productName: item.product?.name || '未知商品',
        // 使用當時的快照價格重新計算單價 (或根據您的需求抓取最新價格)
        unitPrice: Number(item.priceSnapshot?.basePrice || 0) + 
                   Number(item.priceSnapshot?.sizeSurcharge || 0) +
                   Number(item.priceSnapshot?.colorSurcharge || 0) +
                   Number(item.priceSnapshot?.materialSurcharge || 0) +
                   Number(item.priceSnapshot?.handleSurcharge || 0) +
                   (item.serviceType === 'assembled' ? Number(item.priceSnapshot?.assemblyFee || 0) : 0),
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
        serviceType: item.serviceType,
        widthMatrix: item.widthMatrix,
        heightData: item.heightData,
        isCeilingMounted: item.isCeilingMounted,
        siteConditions: item.siteConditions,
        colorName: item.colorName,
        materialName: item.materialName,
        handleName: item.handleName || '',
        openingDirection: item.openingDirection,
        hasThreshold: item.hasThreshold,
        priceSnapshot: item.priceSnapshot
      };
      addToCart(cartItem);
    });
    
    setReorderModal({ isOpen: false, order: null });
    router.push('/cart');
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return { label: '待審核', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> };
      case 'processing': return { label: '生產中', color: 'bg-blue-100 text-blue-800', icon: <Hammer className="w-4 h-4" /> };
      case 'shipped': return { label: '已出貨', color: 'bg-purple-100 text-purple-800', icon: <Truck className="w-4 h-4" /> };
      case 'completed': return { label: '已完成', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> };
      case 'cancelled': return { label: '已取消', color: 'bg-gray-100 text-gray-600', icon: <XCircle className="w-4 h-4" /> };
      default: return { label: status, color: 'bg-gray-100 text-gray-600', icon: null };
    }
  };

  // 如果還在檢查權限或載入中，顯示 Loading
  if (authChecking || loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      
      {/* 刪除確認彈窗 */}
      <Modal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, orderId: '' })}
        type="confirm" 
        title="取消訂單"
        message="確定要取消並刪除這筆訂單嗎？此動作無法復原，且僅能在「待審核」狀態下執行。"
        confirmText={isDeleting ? "刪除中..." : "確認取消"}
        cancelText="保留訂單"
        onConfirm={handleDelete}
      />

      {/* 再次購買確認彈窗 */}
      <Modal 
        isOpen={reorderModal.isOpen}
        onClose={() => setReorderModal({ isOpen: false, order: null })}
        type="confirm" 
        title="再次購買"
        message={`確定要將訂單 ${reorderModal.order?.orderNumber} 的所有商品規格複製到購物車嗎？`}
        confirmText="加入購物車"
        cancelText="取消"
        onConfirm={handleReorder}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div><h1 className="text-3xl font-bold text-gray-900">我的訂單</h1><p className="text-gray-500 mt-2">追蹤您的訂製門扇生產進度</p></div>
          <Link href="/" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"><Package className="w-5 h-5" /> 新增訂單</Link>
        </div>

        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-200"><Package className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-bold text-gray-900">目前沒有訂單</h3><p className="text-gray-500 mt-2">開始您的第一個數位工廠專案吧！</p></div>
          ) : (
            orders.map((order) => {
              const statusInfo = getStatusDisplay(order.status);
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded-lg"><Package className="w-6 h-6 text-gray-600" /></div>
                      <div>
                        <div className="font-mono font-bold text-gray-900 text-lg">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2"><span>{new Date(order.createdAt).toLocaleDateString()}</span><span className="w-1 h-1 bg-gray-300 rounded-full"></span><span>{order.projectName}</span></div>
                      </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${statusInfo.color}`}>{statusInfo.icon}{statusInfo.label}</div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-2"><span>訂購項目：</span><span className="font-bold text-gray-900">{order.items?.length || 0} 件商品</span></div>
                    <div className="space-y-1">
                      {order.items?.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="text-sm text-gray-500 flex justify-between items-center">
                           <div className="flex items-center gap-2"><span>- {item.product?.name}</span>{item.serviceType === 'material' ? <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded flex items-center gap-1"><Package className="w-3 h-3" /> 純料</span> : <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded flex items-center gap-1"><Hammer className="w-3 h-3" /> 代工</span>}</div><span>x{item.quantity}</span>
                        </div>
                      ))}
                      {(order.items?.length || 0) > 2 && <div className="text-xs text-gray-400 pl-2">...還有 {(order.items?.length || 0) - 2} 項</div>}
                    </div>
                    <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center"><span className="font-bold text-gray-900">總金額</span><span className="text-xl font-bold text-blue-600">${Number(order.totalAmount).toLocaleString()}</span></div>
                  </div>

                  <div className="flex justify-end items-center gap-3">
                    {/* ✨✨✨ 再次購買按鈕 ✨✨✨ */}
                    <button 
                      onClick={() => confirmReorder(order)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 border border-blue-200"
                    >
                      <RefreshCw className="w-4 h-4" /> 再次購買
                    </button>

                    {order.status === 'pending' && (
                      <button 
                        onClick={() => confirmDelete(order.id)}
                        disabled={isDeleting && deleteModal.orderId === order.id}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                      >
                        {isDeleting && deleteModal.orderId === order.id ? '刪除中...' : <><Trash2 className="w-4 h-4" /> 取消</>}
                      </button>
                    )}
                    
                    <Link href={`/orders/${order.id}/print`} target="_blank" className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-bold text-sm transition-colors">列印工單</Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Package, Users, Settings, Bell, Search, Filter, 
  CheckCircle, Clock, Info, ChevronRight, FileSpreadsheet, Calendar, User, Truck, Hammer
} from 'lucide-react';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import { api, Order } from '@/lib/api'; // ✨ 修改：直接從 @/lib/api 引入 Order 介面
import OrderDetailModal from '@/components/OrderDetailModal';

// ❌ 移除：原本這裡重複定義且不完整的 Order 介面
/*
interface Order {
  id: string;
  orderNumber: string;
  projectName: string;
  status: string;
  totalAmount: string; // 注意：api.ts 裡可能是 number
  createdAt: string;
  product?: { name: string };
  user?: { 
    email: string;
    dealerProfile?: { companyName: string; level: string };
  };
  widthMatrix?: any;
  heightData?: any;
  serviceType?: string;
}
*/

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // 篩選條件狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [dealerFilter, setDealerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('somalink_admin_token');
    if (!token) { router.push('/login'); }
  }, [router]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders/all');
      // 確保 API 回傳的資料符合 Order[] 型別，通常 API 回傳的就是正確結構
      setOrders(res); // api.get 已經在 lib/api.ts 裡處理過 .data 了，這裡直接拿 res 即可 (如果您的 api.get 實作是 return response.data)
                      // 如果 api.get 回傳的是 response，則用 res.data
                      // 根據您提供的 admin/src/lib/api.ts，api.get 是回傳 response.data，所以這裡應該是 setOrders(res)
                      // 但如果您的後端回傳結構是 { data: [...] }，則需視情況調整。
                      // 假設後端回傳的是直接的 Order 陣列。
    } catch (err) {
      console.error('無法取得訂單列表', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem('somalink_admin_token')) {
      fetchOrders();
    }
  }, [fetchOrders]);

  // 過濾邏輯
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.projectName && order.projectName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // 因為 Order 介面結構改變，這裡存取 user.dealerProfile 的方式可能需要確認
      // 根據 lib/api.ts，user 結構包含 dealerProfile
      const dealerName = order.user?.dealerProfile?.companyName || order.user?.name || '';
      
      const matchesDealer = dealerName.toLowerCase().includes(dealerFilter.toLowerCase());
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      const matchesDate = dateFilter ? orderDate === dateFilter : true;
      const matchesStatus = statusFilter === 'all' ? true : order.status === statusFilter;

      return matchesSearch && matchesDealer && matchesDate && matchesStatus;
    });
  }, [orders, searchTerm, dealerFilter, dateFilter, statusFilter]);

  // Excel 匯出
  const handleExportExcel = () => {
    const dataToExport = filteredOrders.map(o => ({
      '訂單編號': o.orderNumber,
      '建立日期': new Date(o.createdAt).toLocaleDateString(),
      '案場名稱': o.projectName,
      '經銷商': o.user?.dealerProfile?.companyName || o.user?.email,
      // '會員等級': o.user?.dealerProfile?.level, // lib/api.ts 的 Order 介面可能沒有 level，需確認
      // 如果需要顯示第一項產品名稱作為代表
      '產品名稱': o.items?.[0]?.product?.name || '多品項',
      // '交易模式': o.serviceType === 'assembled' ? '含代工' : '純材料', // 這現在是在 items 裡
      '總金額': Number(o.totalAmount),
      '訂單狀態': o.status === 'pending' ? '待審核' : 
                  o.status === 'processing' ? '生產中' : 
                  o.status === 'shipped' ? '已出貨' : o.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SomaLink訂單");
    XLSX.writeFile(workbook, `SomaLink_Orders_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // 狀態顯示設定
  const statusMap: Record<string, any> = {
    pending: { label: '待審核', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    processing: { label: '生產中', color: 'bg-blue-100 text-blue-800', icon: Hammer },
    shipped: { label: '已出貨', color: 'bg-purple-100 text-purple-800', icon: Truck }, 
    completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-600', icon: Info },
  };

  // 取得按鈕文字與樣式
  const getActionButton = (status: string) => {
    switch (status) {
      case 'pending': return { text: '審核', style: 'text-blue-600 hover:text-blue-800' };
      case 'processing': return { text: '管理', style: 'text-purple-600 hover:text-purple-800' }; 
      case 'shipped': return { text: '追蹤', style: 'text-green-600 hover:text-green-800' };    
      default: return { text: '詳情', style: 'text-gray-500 hover:text-gray-700' };
    }
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
      
      <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-gray-500" />
          訂單戰情室
        </h2>
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full relative">
            <Bell className="w-5 h-5" /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">篩選結果筆數</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-4xl font-bold text-gray-900">{filteredOrders.length}</p>
              <span className="text-xs text-gray-400 px-2 py-1">筆訂單</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">待審核 (篩選內)</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-4xl font-bold text-yellow-600">{filteredOrders.filter(o => o.status === 'pending').length}</p>
              <span className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded font-medium">需處理</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">累積金額 (篩選內)</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-4xl font-bold text-blue-600">${filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Order Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* 篩選工具列 */}
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-4">
            
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="搜尋單號、案名..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>

            <div className="relative w-48">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="篩選經銷商名稱" 
                value={dealerFilter}
                onChange={(e) => setDealerFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>

            <div className="relative w-48">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="date" 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-600" 
              />
            </div>

            <div className="relative w-40">
              <Filter className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white text-gray-600 cursor-pointer"
              >
                <option value="all">全部狀態</option>
                <option value="pending">待審核</option>
                <option value="processing">生產中</option>
                <option value="shipped">已出貨</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            {(searchTerm || dealerFilter || dateFilter || statusFilter !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setDealerFilter('');
                  setDateFilter('');
                  setStatusFilter('all');
                }}
                className="text-xs text-red-500 hover:underline px-2"
              >
                清除篩選
              </button>
            )}

            <div className="ml-auto">
              <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" /> 匯出 Excel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">單號 / 案場</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">經銷商</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">產品概要</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">金額</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">日期</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">狀態</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">動作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? <tr><td colSpan={7} className="text-center py-12 text-gray-500">資料載入中...</td></tr> : 
                 filteredOrders.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-gray-500">查無符合條件的訂單</td></tr> : 
                 filteredOrders.map((order) => {
                    const status = statusMap[order.status as string] || { label: order.status, color: 'bg-gray-100', icon: Info };
                    const StatusIcon = status.icon;
                    const action = getActionButton(order.status as string); 

                    // 顯示第一項產品名稱，如果有多個則顯示 +N
                    const firstItem = order.items?.[0];
                    const productSummary = firstItem ? (
                        <>
                            {firstItem.product.name} 
                            {order.items.length > 1 && <span className="text-xs text-gray-400 ml-1">+{order.items.length - 1}</span>}
                        </>
                    ) : '無商品';

                    return (
                      <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600">{order.orderNumber}</span>
                            <span className="text-xs text-gray-500 mt-0.5">{order.projectName || '未命名案場'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-900 font-medium">{order.user?.dealerProfile?.companyName || '未知'}</span>
                            {/* 如果 api.ts 的 Order 沒有定義 level，這裡可以拿掉或選用其他欄位 */}
                            {/* <div className="flex items-center gap-2 mt-1">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 border">{order.user?.dealerProfile?.level || '?'} 級</span>
                            </div> */}
                          </div>
                        </td>
                        {/* 顯示產品概要 */}
                        <td className="px-6 py-4 text-sm text-gray-600">{productSummary}</td>
                        <td className="px-6 py-4 text-sm font-bold text-blue-600">${Number(order.totalAmount).toLocaleString()}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={clsx("px-2.5 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1.5 border", status.color, "border-transparent")}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setSelectedOrder(order)} 
                            className={clsx("font-medium text-sm flex items-center justify-end gap-1 transition-colors", action.style)}
                          >
                            {action.text} <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <OrderDetailModal 
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusUpdate={fetchOrders} 
      />
    </main>
  );
}
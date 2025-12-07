'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; 
import { 
  LayoutDashboard, Bell, Search, Filter, 
  CheckCircle, Clock, Info, ChevronRight, FileSpreadsheet, Calendar, User, Truck, Hammer, CheckSquare, Square
} from 'lucide-react';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import { api, Order } from '@/lib/api';
import OrderDetailModal from '@/components/OrderDetailModal';

export default function AdminDashboard() {
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // ✨✨✨ 新增：多選狀態 ✨✨✨
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 篩選狀態
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
      setLoading(true);
      const res = await api.get('/orders');
      if (Array.isArray(res)) {
        setOrders(res);
      } else {
        setOrders([]); 
      }
    } catch (err) {
      console.error('無法取得訂單列表:', err);
      setOrders([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('somalink_admin_token')) {
      fetchOrders();
    }
  }, [fetchOrders]);

  // 過濾邏輯
  const filteredOrders = useMemo(() => {
    return (orders || []).filter(order => {
      if (!order) return false;
      const matchesSearch = (order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) || (order.projectName && order.projectName.toLowerCase().includes(searchTerm.toLowerCase()));
      const dealerName = order.user?.dealerProfile?.companyName || order.user?.name || '';
      const matchesDealer = dealerName.toLowerCase().includes(dealerFilter.toLowerCase());
      const orderDate = order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : '';
      const matchesDate = dateFilter ? orderDate === dateFilter : true;
      const matchesStatus = statusFilter === 'all' ? true : order.status === statusFilter;
      return matchesSearch && matchesDealer && matchesDate && matchesStatus;
    });
  }, [orders, searchTerm, dealerFilter, dateFilter, statusFilter]);

  // ✨✨✨ 多選操作邏輯 ✨✨✨
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set()); // 取消全選
    } else {
      setSelectedIds(new Set(filteredOrders.map(o => o.id))); // 全選目前頁面
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // ✨✨✨ 1. 匯出：一般訂單總表 (財務對帳用) ✨✨✨
  const handleExportOrders = () => {
    // 只匯出勾選的，若無勾選則匯出當前篩選結果
    const targetOrders = selectedIds.size > 0 
      ? filteredOrders.filter(o => selectedIds.has(o.id)) 
      : filteredOrders;

    const data = targetOrders.map(o => ({
      '訂單編號': o.orderNumber,
      '狀態': o.status,
      '日期': new Date(o.createdAt).toLocaleDateString(),
      '經銷商': o.user?.dealerProfile?.companyName || o.user?.email,
      '案場': o.projectName,
      '總金額': Number(o.totalAmount),
      '商品數': o.items?.length || 0
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "訂單總表");
    XLSX.writeFile(wb, `SomaLink_Orders_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // ✨✨✨ 2. 匯出：詳細生產工單 (工廠備料用) ✨✨✨
  const handleExportProduction = () => {
    const targetOrders = selectedIds.size > 0 
      ? filteredOrders.filter(o => selectedIds.has(o.id)) 
      : filteredOrders;

    // 將資料「攤平」：一張訂單有多個商品，變成多行
    const flatData: any[] = [];
    
    targetOrders.forEach(order => {
      order.items?.forEach((item, idx) => {
        flatData.push({
          '訂單編號': order.orderNumber,
          '項次': idx + 1,
          '案場名稱': order.projectName,
          '產品名稱': item.product?.name,
          '顏色': item.colorName,
          '材質': item.materialName,
          '把手': item.handleName || '無', // 把手欄位
          '開向': item.openingDirection,
          '寬 (W)': item.widthMatrix?.mid,
          '高 (H)': item.heightData?.singleValue || item.heightData?.mid,
          '封頂': item.isCeilingMounted ? '是' : '否',
          '數量': item.quantity,
          '備註': order.customerNote || ''
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(flatData);
    
    // 設定欄寬 (美化)
    const wscols = [
      {wch: 15}, {wch: 5}, {wch: 15}, {wch: 20}, {wch: 10}, 
      {wch: 10}, {wch: 10}, {wch: 10}, {wch: 8}, {wch: 8}, 
      {wch: 6}, {wch: 6}, {wch: 20}
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "生產備料單");
    XLSX.writeFile(wb, `Production_List_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // ✨✨✨ 3. 批量更新狀態 ✨✨✨
  const handleBatchStatus = async (status: string) => {
    if (selectedIds.size === 0) return alert('請先勾選訂單');
    if (!confirm(`確定要將選中的 ${selectedIds.size} 筆訂單狀態改為「${status}」嗎？`)) return;

    try {
      const promises = Array.from(selectedIds).map(id => 
        api.patch(`/orders/${id}`, { status })
      );
      await Promise.all(promises);
      alert('批量更新成功！');
      setSelectedIds(new Set()); // 清空勾選
      fetchOrders();
    } catch (err) {
      alert('部分更新失敗，請檢查網路');
    }
  };

  const statusMap: Record<string, any> = {
    pending: { label: '待審核', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    processing: { label: '生產中', color: 'bg-blue-100 text-blue-800', icon: Hammer },
    shipped: { label: '已出貨', color: 'bg-purple-100 text-purple-800', icon: Truck }, 
    completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-600', icon: Info },
  };

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
          <Link href="/logs" className="p-2 text-gray-400 hover:bg-gray-100 rounded-full relative transition-colors" title="系統日誌">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        
        {/* KPI 卡片 (保持不變) */}
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* 工具列 (篩選 + 批量操作) */}
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-4">
            
            {/* ... 原本的篩選欄位 ... */}
            <div className="relative w-48">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="搜尋單號、案名..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            {/* ... (省略部分篩選欄位以節省篇幅，請保留您原本的篩選器) ... */}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white text-gray-600 cursor-pointer">
              <option value="all">全部狀態</option>
              <option value="pending">待審核</option>
              <option value="processing">生產中</option>
              <option value="shipped">已出貨</option>
            </select>

            <div className="ml-auto flex items-center gap-2">
              {/* ✨✨✨ 批量操作按鈕 ✨✨✨ */}
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 mr-4 animate-in fade-in">
                  <span className="text-sm text-gray-500 font-bold">已選 {selectedIds.size} 筆：</span>
                  <button onClick={() => handleBatchStatus('processing')} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors">批量審核</button>
                  <button onClick={() => handleBatchStatus('shipped')} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-200 transition-colors">批量出貨</button>
                </div>
              )}

              {/* 匯出按鈕組 */}
              <div className="flex gap-2 border-l pl-4 border-gray-300">
                <button 
                  onClick={handleExportOrders}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 shadow-sm transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4" /> 匯出對帳單
                </button>
                <button 
                  onClick={handleExportProduction}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm transition-all"
                >
                  <Hammer className="w-4 h-4" /> 匯出生產工單
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* ✨ 全選 Checkbox */}
                  <th className="px-6 py-3 w-10">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-blue-600">
                      {selectedIds.size > 0 && selectedIds.size === filteredOrders.length 
                        ? <CheckSquare className="w-5 h-5 text-blue-600" /> 
                        : <Square className="w-5 h-5" />}
                    </button>
                  </th>
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
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-500">資料載入中...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-500">查無符合條件的訂單</td></tr>
                ) : (
                  filteredOrders.map((order) => {
                    const status = statusMap[order.status as string] || { label: order.status, color: 'bg-gray-100', icon: Info };
                    const StatusIcon = status.icon;
                    const action = getActionButton(order.status as string); 
                    const firstItem = order.items?.[0];
                    const isSelected = selectedIds.has(order.id);

                    return (
                      <tr key={order.id} className={clsx("transition-colors group", isSelected ? "bg-blue-50" : "hover:bg-gray-50")}>
                        {/* ✨ 單選 Checkbox */}
                        <td className="px-6 py-4">
                          <button onClick={() => toggleSelectOne(order.id)} className="text-gray-400 hover:text-blue-600">
                            {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                          </button>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600">{order.orderNumber}</span>
                            <span className="text-xs text-gray-500 mt-0.5">{order.projectName || '未命名案場'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-900 font-medium">{order.user?.dealerProfile?.companyName || '未知'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                           {firstItem?.product?.name || '無商品'} 
                           {order.items.length > 1 && <span className="text-xs text-gray-400 ml-1">+{order.items.length - 1}</span>}
                        </td>
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
                )}
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
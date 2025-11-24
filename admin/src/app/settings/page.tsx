'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Briefcase, Ruler, Megaphone, Percent, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { api } from '@/lib/api';

// 定義介面以確保型別安全
interface Category {
  id: string; // 這是 UUID
  name: string;
  code: string;
  isUpgradeable: boolean;
  discountRate: number;
}

interface Announcement {
  id: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('category');
  
  // 資料狀態
  const [categories, setCategories] = useState<Category[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // 載入類別
  const fetchCategories = async () => {
    try {
      const res = await api.get('/trade-categories');
      setCategories(res.data || res); // 兼容可能回傳 { data: [] } 或直接 [] 的情況
    } catch (err) { 
      console.error('載入分類失敗:', err); 
    }
  };

  // 載入公告
  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data || res);
    } catch (err) { 
      console.error('載入公告失敗:', err); 
    }
  };

  useEffect(() => {
    if (activeTab === 'category') fetchCategories();
    if (activeTab === 'announcement') fetchAnnouncements();
  }, [activeTab]);

  // --- 類別操作 ---
  const handleAddCategory = async () => {
    const name = prompt('請輸入分類名稱 (例如: 專業玻璃行)'); 
    if (!name) return;
    
    const code = prompt('請輸入代碼 (英文, 例如: glass_shop)'); 
    if (!code) return;
    
    const rateStr = prompt('預設折數 (1.0 = 原價, 0.8 = 8折)', '1.0');
    
    try {
      await api.post('/trade-categories', { 
        name, 
        code, 
        discountRate: parseFloat(rateStr || '1.0'), 
        isUpgradeable: false 
      });
      fetchCategories();
    } catch (e) { 
      alert('新增失敗，可能是代碼重複'); 
      console.error(e);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if(!confirm('確定要刪除此分類嗎？')) return;
    try {
      // 關鍵：這裡傳入的是 id (UUID)，不是 code
      await api.delete(`/trade-categories/${id}`); 
      fetchCategories(); 
    } catch (e) {
      alert('刪除失敗');
      console.error(e);
    }
  };

  const handleToggleCategory = async (id: string, val: boolean) => {
    try {
      await api.patch(`/trade-categories/${id}`, { isUpgradeable: !val }); 
      fetchCategories();
    } catch (e) {
      console.error(e);
      alert('更新失敗');
    }
  };

  const handleRateChange = async (id: string, val: number) => {
    try {
      await api.patch(`/trade-categories/${id}`, { discountRate: val });
      // 這裡不需重新 fetch，因為只是改數字，且輸入框已有 local state
    } catch (e) {
      console.error(e);
      alert('更新折數失敗');
    }
  };

  // --- 公告操作 ---
  const handleAddAnnouncement = async () => {
    const content = prompt('請輸入公告內容：');
    if (!content) return;
    try {
      await api.post('/announcements', { content });
      fetchAnnouncements();
    } catch (e) { 
      alert('發布失敗'); 
    }
  };

  const handleToggleAnnouncement = async (id: string, currentVal: boolean) => {
    try {
      await api.patch(`/announcements/${id}`, { isActive: !currentVal });
      fetchAnnouncements();
    } catch (e) { 
      alert('更新失敗'); 
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if(!confirm('確定刪除此公告？')) return;
    try {
      await api.delete(`/announcements/${id}`);
      fetchAnnouncements();
    } catch (e) { 
      alert('刪除失敗'); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <div className="p-2 bg-gray-200 rounded-lg"><Briefcase className="w-6 h-6 text-gray-700" /></div>
          系統設定
        </h1>
        <p className="text-gray-500 text-sm mt-1">管理營業類別、施工參數與系統公告</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 左側選單 */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          <button onClick={() => setActiveTab('category')} className={clsx("w-full text-left px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-all", activeTab === 'category' ? "bg-white shadow-sm text-blue-600 border border-blue-100" : "text-gray-600 hover:bg-white hover:shadow-sm")}>
            <Briefcase className="w-5 h-5" /> 營業類別管理
          </button>
          <button onClick={() => setActiveTab('params')} className={clsx("w-full text-left px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-all", activeTab === 'params' ? "bg-white shadow-sm text-blue-600 border border-blue-100" : "text-gray-600 hover:bg-white hover:shadow-sm")}>
            <Ruler className="w-5 h-5" /> 施工參數設定
          </button>
          <button onClick={() => setActiveTab('announcement')} className={clsx("w-full text-left px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-all", activeTab === 'announcement' ? "bg-white shadow-sm text-blue-600 border border-blue-100" : "text-gray-600 hover:bg-white hover:shadow-sm")}>
            <Megaphone className="w-5 h-5" /> 網站公告
          </button>
        </div>

        {/* 右側內容 */}
        <div className="flex-1">
          
          {/* Tab 1: 營業類別 */}
          {activeTab === 'category' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">營業類別管理</h3>
                <button onClick={handleAddCategory} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold text-sm"><Plus className="w-4 h-4" /> 新增</button>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">名稱</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">預設折數</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">升級資格</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        {cat.name} <span className="text-gray-400 text-xs">({cat.code})</span>
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="number" 
                          step="0.01" 
                          defaultValue={cat.discountRate} 
                          onBlur={(e) => handleRateChange(cat.id, parseFloat(e.target.value))} 
                          className="w-16 p-1 border rounded text-center font-mono text-sm" 
                        />
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleToggleCategory(cat.id, cat.isUpgradeable)} 
                          className={clsx("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", cat.isUpgradeable ? "bg-green-500" : "bg-gray-200")}
                        >
                          <span className={clsx("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", cat.isUpgradeable ? "translate-x-6" : "translate-x-1")}/>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* 這裡使用的是 cat.id (UUID)，不是 code */}
                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {categories.length === 0 && (
                <div className="p-8 text-center text-gray-500">尚無分類資料</div>
              )}
            </div>
          )}

          {/* Tab 2: 施工參數 (暫無內容) */}
          {activeTab === 'params' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              施工參數設定功能開發中...
            </div>
          )}

          {/* Tab 3: 網站公告 */}
          {activeTab === 'announcement' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">網站公告發布</h3>
                  <p className="text-sm text-gray-500">發布的公告將顯示於經銷商前台首頁頂部。</p>
                </div>
                <button onClick={handleAddAnnouncement} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold text-sm"><Plus className="w-4 h-4" /> 發布公告</button>
              </div>
              
              {announcements.length === 0 ? (
                <div className="p-8 text-center text-gray-500">目前無公告</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">公告內容</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">狀態</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">發布時間</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {announcements.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.content}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleToggleAnnouncement(item.id, item.isActive)}
                            className={clsx(
                              "px-2 py-1 rounded text-xs font-bold transition-colors",
                              item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            )}
                          >
                            {item.isActive ? '顯示中' : '已隱藏'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDeleteAnnouncement(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
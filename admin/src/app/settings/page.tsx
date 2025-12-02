'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Briefcase, Ruler, Megaphone, LayoutTemplate, Loader2, UploadCloud, X, ArrowUp, ArrowDown, Edit, List, Image as ImageIcon, Settings as SettingsIcon, ShieldAlert, Lock, Globe, Percent, CalendarClock, Building } from 'lucide-react';
import clsx from 'clsx';
import { api } from '@/lib/api';

const CLOUDINARY_CLOUD_NAME = 'dnibj8za6'; 
const CLOUDINARY_PRESET = 'yasou70731'; 

interface Category { id: string; name: string; code: string; isUpgradeable: boolean; discountRate: number; }
interface Announcement { id: string; content: string; isActive: boolean; createdAt: string; }

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('category');
  
  // 資料狀態
  const [categories, setCategories] = useState<Category[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [siteConfig, setSiteConfig] = useState<any>({ blocks: [] });
  
  // 系統規則狀態
  const [systemRules, setSystemRules] = useState<any>({
    enable_registration: true,
    maintenance_mode: false,
    allow_guest_view: true,
    discount_level_A: 0.85,
    discount_level_B: 0.95,
    order_reset_day: 1,
    company_name: '',
    tax_id: '',
    phone: '',
    address: '',
    copyright_text: ''
  });

  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [editingBlock, setEditingBlock] = useState<any>(null); // 正在編輯的積木
  const [isUploading, setIsUploading] = useState(false);

  // 載入資料
  const fetchCategories = async () => { try { const res = await api.get('/trade-categories'); setCategories(res.data || res); } catch (e) {} };
  const fetchAnnouncements = async () => { try { const res = await api.get('/announcements'); setAnnouncements(res.data || res); } catch (e) {} };
  const fetchSiteConfig = async () => {
    setIsConfigLoading(true);
    try { const res = await api.get('/site-config/homepage'); if (!res.blocks) res.blocks = []; setSiteConfig(res); } catch (e) {}
    finally { setIsConfigLoading(false); }
  };
  const fetchSystemRules = async () => {
    try { const res = await api.get('/site-config/rules'); if (res.settings) setSystemRules(res.settings); } catch (e) {}
  };

  useEffect(() => {
    if (activeTab === 'category') fetchCategories();
    if (activeTab === 'announcement') fetchAnnouncements();
    if (activeTab === 'homepage') fetchSiteConfig();
    if (activeTab === 'rules') fetchSystemRules();
  }, [activeTab]);

  // --- 1. 營業類別操作 ---
  const handleAddCategory = async () => {
    const name = prompt('請輸入分類名稱'); if (!name) return;
    const code = prompt('請輸入代碼'); if (!code) return;
    const rateStr = prompt('預設折數', '1.0');
    try { await api.post('/trade-categories', { name, code, discountRate: parseFloat(rateStr || '1.0'), isUpgradeable: false }); fetchCategories(); } 
    catch (e) { alert('新增失敗'); }
  };
  const handleDeleteCategory = async (id: string) => { if(confirm('確定刪除？')) { await api.delete(`/trade-categories/${id}`); fetchCategories(); } };
  const handleToggleCategory = async (id: string, val: boolean) => { await api.patch(`/trade-categories/${id}`, { isUpgradeable: !val }); fetchCategories(); };
  const handleRateChange = async (id: string, val: number) => { await api.patch(`/trade-categories/${id}`, { discountRate: val }); };
  
  // --- 2. 公告操作 ---
  const handleAddAnnouncement = async () => { const content = prompt('內容：'); if(content) { await api.post('/announcements', { content }); fetchAnnouncements(); } };
  const handleToggleAnnouncement = async (id: string, val: boolean) => { await api.patch(`/announcements/${id}`, { isActive: !val }); fetchAnnouncements(); };
  const handleDeleteAnnouncement = async (id: string) => { if(confirm('刪除?')) { await api.delete(`/announcements/${id}`); fetchAnnouncements(); }};

  // --- 3. 首頁積木操作 ---
  const addBlock = (type: string) => {
    const newBlock = {
      id: crypto.randomUUID(),
      type,
      data: type === 'HERO' ? { title: '新標題', subtitle: '副標題', images: [] } :
            type === 'FEATURES' ? { title: '特色介紹', items: [{title:'特色1', desc:'描述'},{title:'特色2', desc:'描述'},{title:'特色3', desc:'描述'}] } :
            { title: '產品列表', count: 4 }
    };
    setSiteConfig({ ...siteConfig, blocks: [...(siteConfig.blocks || []), newBlock] });
  };
  const removeBlock = (id: string) => { if(!confirm('確定移除此區塊？')) return; setSiteConfig({ ...siteConfig, blocks: siteConfig.blocks.filter((b: any) => b.id !== id) }); };
  const moveBlock = (index: number, direction: -1 | 1) => {
    const newBlocks = [...siteConfig.blocks];
    if (index + direction < 0 || index + direction >= newBlocks.length) return;
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + direction];
    newBlocks[index + direction] = temp;
    setSiteConfig({ ...siteConfig, blocks: newBlocks });
  };
  const saveConfig = async () => { try { await api.patch('/site-config/homepage', siteConfig); alert('儲存成功！前台首頁已更新。'); } catch (e) { alert('儲存失敗'); } };
  
  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setIsUploading(true);
    const newImages = [...(editingBlock.data.images || [])];
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('upload_preset', CLOUDINARY_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.secure_url) newImages.push(data.secure_url);
      }
      setEditingBlock({ ...editingBlock, data: { ...editingBlock.data, images: newImages } });
    } finally { setIsUploading(false); }
  };

  // --- 4. 系統規則操作 ---
  const saveRules = async () => {
    try {
      await api.patch('/site-config/rules', systemRules);
      alert('系統規則已更新！');
    } catch (e) { alert('儲存失敗'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <div className="p-2 bg-gray-200 rounded-lg"><Briefcase className="w-6 h-6 text-gray-700" /></div>
          系統設定
        </h1>
        <p className="text-gray-500 text-sm mt-1">全域參數配置中心</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 左側選單 */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          <button onClick={() => setActiveTab('category')} className={clsx("w-full text-left px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-all", activeTab === 'category' ? "bg-white shadow-sm text-blue-600 border border-blue-100" : "text-gray-600 hover:bg-white hover:shadow-sm")}><Briefcase className="w-5 h-5" /> 營業類別管理</button>
          <button onClick={() => setActiveTab('params')} className={clsx("w-full text-left px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-all", activeTab === 'params' ? "bg-white shadow-sm text-blue-600 border border-blue-100" : "text-gray-600 hover:bg-white hover:shadow-sm")}><Ruler className="w-5 h-5" /> 施工參數設定</button>
          <button onClick={() => setActiveTab('announcement')} className={clsx("w-full text-left px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-all", activeTab === 'announcement' ? "bg-white shadow-sm text-blue-600 border border-blue-100" : "text-gray-600 hover:bg-white hover:shadow-sm")}><Megaphone className="w-5 h-5" /> 網站公告</button>
          <button onClick={() => setActiveTab('homepage')} className={clsx("w-full text-left px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-all", activeTab === 'homepage' ? "bg-white shadow-sm text-blue-600 border border-blue-100" : "text-gray-600 hover:bg-white hover:shadow-sm")}><LayoutTemplate className="w-5 h-5" /> 首頁積木配置</button>
          <button onClick={() => setActiveTab('rules')} className={clsx("w-full text-left px-4 py-3 rounded-lg font-medium flex items-center gap-3 transition-all", activeTab === 'rules' ? "bg-white shadow-sm text-blue-600 border border-blue-100" : "text-gray-600 hover:bg-white hover:shadow-sm")}><SettingsIcon className="w-5 h-5" /> 系統規則設定</button>
        </div>

        {/* 右側內容 */}
        <div className="flex-1">
          
          {/* Tab 1: 營業類別 (完整邏輯) */}
          {activeTab === 'category' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">營業類別管理</h3>
                <button onClick={handleAddCategory} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold text-sm"><Plus className="w-4 h-4" /> 新增</button>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">名稱</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">預設折數</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">升級資格</th><th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">操作</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{cat.name} <span className="text-gray-400 text-xs">({cat.code})</span></td>
                      <td className="px-6 py-4"><input type="number" step="0.01" defaultValue={cat.discountRate} onBlur={(e) => handleRateChange(cat.id, parseFloat(e.target.value))} className="w-16 p-1 border rounded text-center font-mono text-sm" /></td>
                      <td className="px-6 py-4"><button onClick={() => handleToggleCategory(cat.id, cat.isUpgradeable)} className={clsx("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", cat.isUpgradeable ? "bg-green-500" : "bg-gray-200")}><span className={clsx("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", cat.isUpgradeable ? "translate-x-6" : "translate-x-1")}/></button></td>
                      <td className="px-6 py-4 text-right"><button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: 施工參數 (保留佔位) */}
          {activeTab === 'params' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">施工參數設定功能開發中...</div>
          )}

          {/* Tab 3: 網站公告 (完整邏輯) */}
          {activeTab === 'announcement' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">網站公告發布</h3>
                <button onClick={handleAddAnnouncement} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold text-sm"><Plus className="w-4 h-4" /> 發布公告</button>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">公告內容</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">狀態</th><th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">操作</th></tr></thead>
                <tbody className="divide-y divide-gray-200">
                  {announcements.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{item.content}</td>
                      <td className="px-6 py-4"><button onClick={() => handleToggleAnnouncement(item.id, item.isActive)} className={clsx("px-2 py-1 rounded text-xs font-bold", item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>{item.isActive ? '顯示中' : '已隱藏'}</button></td>
                      <td className="px-6 py-4 text-right"><button onClick={() => handleDeleteAnnouncement(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 4: 首頁積木配置 (完整邏輯) */}
          {activeTab === 'homepage' && (
            <div className="flex gap-8 items-start">
              <div className="w-1/3 bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
                <h3 className="font-bold text-gray-700 border-b pb-2 mb-2">區塊排序與管理</h3>
                {isConfigLoading ? <div className="text-center py-4"><Loader2 className="animate-spin w-6 h-6 text-blue-600 mx-auto" /></div> : (
                  <div className="space-y-3">
                    {siteConfig.blocks?.map((block: any, idx: number) => (
                      <div key={block.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg group hover:border-blue-300 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                          <span className="font-medium text-gray-700 text-sm">
                            {block.type === 'HERO' ? '主視覺輪播' : block.type === 'FEATURES' ? '特色介紹' : '產品列表'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveBlock(idx, -1)} disabled={idx === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                          <button onClick={() => moveBlock(idx, 1)} disabled={idx === siteConfig.blocks.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                          <button onClick={() => setEditingBlock(block)} className="p-1 hover:bg-blue-100 text-blue-600 rounded"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => removeBlock(block.id)} className="p-1 hover:bg-red-100 text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                    {siteConfig.blocks?.length === 0 && <div className="text-center text-gray-400 py-4 text-sm">目前無區塊</div>}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2 border-t mt-4">
                  <button onClick={() => addBlock('HERO')} className="p-2 bg-gray-50 border border-dashed border-gray-300 rounded hover:border-blue-500 hover:text-blue-600 flex flex-col items-center gap-1 text-[10px] font-medium transition-colors"><ImageIcon className="w-4 h-4" />+ 主視覺</button>
                  <button onClick={() => addBlock('FEATURES')} className="p-2 bg-gray-50 border border-dashed border-gray-300 rounded hover:border-blue-500 hover:text-blue-600 flex flex-col items-center gap-1 text-[10px] font-medium transition-colors"><List className="w-4 h-4" />+ 特色欄</button>
                  <button onClick={() => addBlock('PRODUCT_LIST')} className="p-2 bg-gray-50 border border-dashed border-gray-300 rounded hover:border-blue-500 hover:text-blue-600 flex flex-col items-center gap-1 text-[10px] font-medium transition-colors"><LayoutTemplate className="w-4 h-4" />+ 產品列</button>
                </div>

                <button onClick={saveConfig} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"><Save className="w-4 h-4" /> 儲存發布</button>
              </div>

              <div className="flex-1 bg-white rounded-xl border border-gray-200 p-8 flex flex-col items-center justify-center text-gray-400 min-h-[400px]">
                <LayoutTemplate className="w-16 h-16 mb-4 text-gray-200" />
                <p className="text-lg font-medium text-gray-500">點擊左側「筆」圖示開始編輯</p>
                <p className="text-sm mt-2">您可以新增多個區塊，並自由拖曳排序。</p>
              </div>
            </div>
          )}

          {/* ✨ Tab 5: 系統規則設定 (完整邏輯) */}
          {activeTab === 'rules' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-gray-900">系統營運規則</h3>
                <p className="text-sm text-gray-500">控制網站的全域開關與權限</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Building className="w-4 h-4" /> 公司資訊與頁尾設定</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="col-span-1 md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">公司名稱</label><input type="text" value={systemRules.company_name || ''} onChange={(e) => setSystemRules({...systemRules, company_name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">統一編號</label><input type="text" value={systemRules.tax_id || ''} onChange={(e) => setSystemRules({...systemRules, tax_id: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">聯絡電話</label><input type="text" value={systemRules.phone || ''} onChange={(e) => setSystemRules({...systemRules, phone: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none" /></div>
                  <div className="col-span-1 md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">公司地址</label><input type="text" value={systemRules.address || ''} onChange={(e) => setSystemRules({...systemRules, address: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none" /></div>
                  <div className="col-span-1 md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">版權宣告 (Copyright)</label><input type="text" value={systemRules.copyright_text || ''} onChange={(e) => setSystemRules({...systemRules, copyright_text: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none" /></div>
                </div>
              </div>
              
              <div className="border-t border-gray-100 my-4"></div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900 mb-1">🔒 核心金流規則 (已硬編碼寫死)</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>A 級會員儲值上限：<span className="font-mono font-bold">NT$ 200,000</span></li>
                    <li>B 級會員儲值上限：<span className="font-mono font-bold">NT$ 100,000</span></li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Percent className="w-4 h-4" /> 會員價格策略</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">A 級會員預設折數</label><input type="number" step="0.01" value={systemRules.discount_level_A} onChange={(e) => setSystemRules({...systemRules, discount_level_A: parseFloat(e.target.value)})} className="w-full p-2 border border-gray-300 rounded-lg outline-none font-mono" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">B 級會員預設折數</label><input type="number" step="0.01" value={systemRules.discount_level_B} onChange={(e) => setSystemRules({...systemRules, discount_level_B: parseFloat(e.target.value)})} className="w-full p-2 border border-gray-300 rounded-lg outline-none font-mono" /></div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2"><CalendarClock className="w-4 h-4" /> 訂單流水號設定</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">流水號重置日 (每月幾號)</label>
                  <input type="number" min="1" max="31" value={systemRules.order_reset_day || 1} onChange={(e) => setSystemRules({...systemRules, order_reset_day: parseInt(e.target.value)})} className="w-full p-2 border border-gray-300 rounded-lg outline-none font-mono" />
                </div>
              </div>

              <div className="space-y-6 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2"><SettingsIcon className="w-4 h-4" /> 功能開關</h4>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-full border"><Lock className="w-5 h-5 text-gray-600" /></div><div><div className="font-bold text-gray-900">開放經銷商註冊</div><div className="text-xs text-gray-500">關閉後，前台註冊功能將隱藏。</div></div></div>
                  <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={systemRules.enable_registration} onChange={(e) => setSystemRules({...systemRules, enable_registration: e.target.checked})} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-full border"><ShieldAlert className="w-5 h-5 text-orange-600" /></div><div><div className="font-bold text-gray-900">系統維護模式</div><div className="text-xs text-gray-500">開啟後，前台將顯示「系統維護中」。</div></div></div>
                  <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={systemRules.maintenance_mode} onChange={(e) => setSystemRules({...systemRules, maintenance_mode: e.target.checked})} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div></label>
                </div>
              </div>

              <button onClick={saveRules} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all mt-4">儲存系統設定</button>
            </div>
          )}

        </div>
      </div>

      {/* 積木編輯 Modal */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <h3 className="text-xl font-bold text-gray-900">編輯區塊</h3>
              <button onClick={() => setEditingBlock(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-5">
              {editingBlock.type === 'HERO' && (
                <>
                  <div><label className="block text-sm font-bold mb-1 text-gray-700">主標題</label><textarea rows={2} value={editingBlock.data.title} onChange={(e) => setEditingBlock({...editingBlock, data: {...editingBlock.data, title: e.target.value}})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                  <div><label className="block text-sm font-bold mb-1 text-gray-700">副標題</label><input type="text" value={editingBlock.data.subtitle} onChange={(e) => setEditingBlock({...editingBlock, data: {...editingBlock.data, subtitle: e.target.value}})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700">輪播圖片</label>
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      {editingBlock.data.images?.map((url: string, i: number) => (
                        <div key={i} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group border">
                          <img src={url} className="w-full h-full object-cover" alt="slide" />
                          <button onClick={() => {
                            const newImgs = editingBlock.data.images.filter((_:any, idx:number) => idx !== i);
                            setEditingBlock({...editingBlock, data: {...editingBlock.data, images: newImgs}});
                          }} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3"/></button>
                        </div>
                      ))}
                      <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer h-full hover:bg-gray-50 transition-colors">
                        {isUploading ? <Loader2 className="animate-spin w-5 h-5 text-gray-400"/> : <Plus className="w-6 h-6 text-gray-400"/>}
                        <span className="text-xs text-gray-500 mt-1">上傳</span>
                        <input type="file" hidden multiple accept="image/*" onChange={handleEditImageUpload} disabled={isUploading} />
                      </label>
                    </div>
                  </div>
                </>
              )}
              {editingBlock.type === 'FEATURES' && (
                <>
                  <div><label className="block text-sm font-bold mb-1 text-gray-700">區塊標題</label><input type="text" value={editingBlock.data.title} onChange={(e) => setEditingBlock({...editingBlock, data: {...editingBlock.data, title: e.target.value}})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                  <div className="space-y-3">
                    {editingBlock.data.items.map((item: any, i: number) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">特色重點 {i + 1}</div>
                        <input type="text" value={item.title} onChange={(e) => { const newItems = [...editingBlock.data.items]; newItems[i].title = e.target.value; setEditingBlock({...editingBlock, data: {...editingBlock.data, items: newItems}}); }} className="w-full p-2 border rounded mb-2 text-sm bg-white" placeholder="標題" />
                        <textarea rows={2} value={item.desc} onChange={(e) => { const newItems = [...editingBlock.data.items]; newItems[i].desc = e.target.value; setEditingBlock({...editingBlock, data: {...editingBlock.data, items: newItems}}); }} className="w-full p-2 border rounded text-sm bg-white" placeholder="描述內容" />
                      </div>
                    ))}
                  </div>
                </>
              )}
              {editingBlock.type === 'PRODUCT_LIST' && (
                <>
                  <div><label className="block text-sm font-bold mb-1 text-gray-700">列表標題</label><input type="text" value={editingBlock.data.title} onChange={(e) => setEditingBlock({...editingBlock, data: {...editingBlock.data, title: e.target.value}})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                  <div><label className="block text-sm font-bold mb-1 text-gray-700">顯示數量</label><input type="number" value={editingBlock.data.count} onChange={(e) => setEditingBlock({...editingBlock, data: {...editingBlock.data, count: Number(e.target.value)}})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                </>
              )}
              <div className="pt-4 border-t mt-4 flex gap-3">
                <button onClick={() => setEditingBlock(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors">取消</button>
                <button onClick={() => { const newBlocks = siteConfig.blocks.map((b: any) => b.id === editingBlock.id ? editingBlock : b); setSiteConfig({ ...siteConfig, blocks: newBlocks }); setEditingBlock(null); }} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm">確認修改</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
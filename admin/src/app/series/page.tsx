'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash2, Save, X, Image as ImageIcon, Loader2, UploadCloud, Layers } from 'lucide-react';
import { api } from '@/lib/api';

// ⚠️ 請填入您的 Cloudinary 資訊
const CLOUDINARY_CLOUD_NAME = 'dnibj8za6'; 
const CLOUDINARY_PRESET = 'yasou70731'; 

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 表單控制
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      name: '',        // 系統代碼
      displayName: '', // 顯示名稱
      description: '', // 描述
      priceStart: 0,   // 起始價
      imageUrl: '',    // 封面圖
      isActive: true
    }
  });

  const imageUrl = watch('imageUrl');
  const [isUploading, setIsUploading] = useState(false);

  // 1. 載入列表
  const fetchSeries = async () => {
    try {
      const res = await api.get('/series');
      setSeriesList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSeries(); }, []);

  // 2. 圖片上傳
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.secure_url) setValue('imageUrl', data.secure_url);
    } catch (err) {
      alert('圖片上傳失敗');
    } finally {
      setIsUploading(false);
    }
  };

  // 3. 送出表單 (新增或修改)
  const onSubmit = async (data: any) => {
    try {
      if (editingId) {
        await api.patch(`/series/${editingId}`, data);
        alert('修改成功');
      } else {
        await api.post('/series', data);
        alert('新增成功');
      }
      closeModal();
      fetchSeries();
    } catch (err) {
      alert('操作失敗 (名稱可能重複)');
    }
  };

  // 4. 刪除
  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此系列嗎？(底下的產品可能會找不到系列)')) return;
    try {
      await api.delete(`/series/${id}`);
      fetchSeries();
    } catch (err) { alert('刪除失敗'); }
  };

  // 開啟編輯
  const openEdit = (series: any) => {
    setEditingId(series.id);
    reset(series);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    reset({ name: '', displayName: '', description: '', priceStart: 0, imageUrl: '', isActive: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" /> 系列管理
          </h1>
          <p className="text-gray-500 text-sm mt-1">管理前台首頁顯示的產品系列與封面圖</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm">
          <Plus className="w-5 h-5" /> 新增系列
        </button>
      </div>

      {/* 列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <p>載入中...</p> : seriesList.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
            <div className="relative h-48 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(item)} className="p-2 bg-white rounded-full shadow hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-2 bg-white rounded-full shadow hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 text-lg">{item.displayName}</h3>
              <p className="text-xs text-gray-500 mb-2">系統代碼: {item.name}</p>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.description}</p>
              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <span className="text-blue-600 font-bold">${item.priceStart?.toLocaleString()} 起</span>
                <span className={`text-xs px-2 py-1 rounded ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {item.isActive ? '顯示中' : '已隱藏'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 彈窗 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{editingId ? '編輯系列' : '新增系列'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">系統代碼 (Name)</label>
                <input {...register('name', { required: true })} placeholder="例如：極簡系列 (需與產品設定一致)" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-400 mt-1">※ 此名稱用於關聯產品，請勿隨意修改</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">顯示名稱 (Display Name)</label>
                <input {...register('displayName', { required: true })} placeholder="例如：極簡細框系列" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">描述</label>
                <textarea {...register('description')} rows={2} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">起始價格</label>
                  <input type="number" {...register('priceStart', { valueAsNumber: true })} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-center mt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('isActive')} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">啟用顯示</span>
                  </label>
                </div>
              </div>

              {/* 圖片上傳 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">封面圖片</label>
                <div className="flex gap-4 items-start">
                  <label className="flex-1 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                    {isUploading ? <Loader2 className="animate-spin text-gray-400" /> : <UploadCloud className="text-gray-400" />}
                    <span className="text-xs text-gray-500 mt-1">點擊上傳圖片</span>
                    <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                  </label>
                  {/* ✨ 修正處：將 flex-shrink-0 改為 shrink-0 */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg border overflow-hidden shrink-0">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} className="w-full h-full object-cover" alt="Preview" />
                    ) : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">預覽</div>}
                  </div>
                </div>
                <input type="hidden" {...register('imageUrl')} />
              </div>

              <button onClick={handleSubmit(onSubmit)} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 mt-4 flex justify-center items-center gap-2">
                <Save className="w-4 h-4" /> 儲存設定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
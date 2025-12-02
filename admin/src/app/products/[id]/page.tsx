'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeft, Save, Plus, Trash2, DollarSign, Ruler, Palette, Layers, MoveHorizontal, Image as ImageIcon, Loader2, UploadCloud, X, Percent } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

const CLOUDINARY_CLOUD_NAME = 'dnibj8za6'; 
const CLOUDINARY_PRESET = 'yasou70731';  

interface ProductFormValues {
  name: string;
  sku: string;
  series: string;
  images: string[]; // 多圖陣列
  basePrice: number;
  requiresMeasurement: boolean;
  standardWidth: number;
  standardHeight: number;
  discountA?: number | null; // ✨ 新增
  discountB?: number | null; // ✨ 新增
  colors: { name: string; colorCode: string; priceSurcharge: number }[];
  materials: { name: string; priceSurcharge: number }[];
  openingOptions: { value: string }[];
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { register, control, handleSubmit, watch, setValue, getValues, reset } = useForm<ProductFormValues>({
    defaultValues: {
      name: '', sku: '', series: '', 
      images: [],
      basePrice: 0, requiresMeasurement: true,
      standardWidth: 90, standardHeight: 210,
      discountA: null,
      discountB: null,
      colors: [],
      materials: [],
      openingOptions: []
    }
  });

  const images = watch('images') || [];
  
  const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({ control, name: 'colors' });
  const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({ control, name: 'materials' });
  const { fields: openingFields, append: appendOpening, remove: removeOpening } = useFieldArray({ control, name: 'openingOptions' });

  // 1. 載入舊資料
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await api.get(`/products/${id}`);
        if (!data) throw new Error("No data");

        // 資料轉換：處理圖片欄位相容性
        let imgList: string[] = [];
        if (Array.isArray(data.images)) {
          imgList = data.images;
        } else if (data.imageUrl) {
          imgList = [data.imageUrl]; // 舊資料只有一張，轉為陣列
        }

        const formattedData = {
          ...data,
          images: imgList,
          discountA: data.discountA || null,
          discountB: data.discountB || null,
          // 確保陣列存在，避免 null 錯誤
          colors: Array.isArray(data.colors) ? data.colors : [],
          materials: Array.isArray(data.materials) ? data.materials : [],
          openingOptions: Array.isArray(data.openingOptions) 
            ? data.openingOptions.map((v: string) => ({ value: v })) 
            : []
        };
        
        reset(formattedData);
      } catch (err) {
        console.error('載入失敗:', err);
        alert('找不到產品資料');
        router.push('/products');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id, reset, router]);

  // 多圖上傳處理
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const currentImages = getValues('images') || [];
    const newImages = [...currentImages];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_PRESET);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.secure_url) newImages.push(data.secure_url);
      }
      setValue('images', newImages);
    } catch (err) {
      alert('上傳失敗');
    } finally {
      setIsUploading(false);
    }
  };

  // 移除單張圖片
  const removeImage = (idx: number) => {
    const current = getValues('images');
    setValue('images', current.filter((_, i) => i !== idx));
  };

  // 送出更新
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      // 過濾掉 id 等系統欄位，避免 500 錯誤
      const { id: _id, createdAt, updatedAt, ...restData } = data as any;
      
      const payload = {
        ...restData,
        discountA: data.discountA ? Number(data.discountA) : null,
        discountB: data.discountB ? Number(data.discountB) : null,
        openingOptions: data.openingOptions.map((opt) => opt.value).filter((v) => v)
      };
      
      await api.patch(`/products/${id}`, payload);
      alert('修改成功！');
      router.push('/products');
    } catch (error) {
      console.error(error);
      alert('修改失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans pb-20">
      {/* Header */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/products" className="p-2 hover:bg-white rounded-full transition-colors text-gray-500">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">編輯產品</h1>
            <p className="text-sm text-gray-500">修改產品 ID: {id}</p>
          </div>
        </div>
        <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md font-bold disabled:opacity-50 transition-all">
          <Save className="w-4 h-4" />
          {isSubmitting ? '儲存中...' : '儲存修改'}
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* 1. 基本資訊與圖片 */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-blue-500 rounded-full"></div> 基本資訊</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">產品名稱</label><input {...register('name')} className="w-full p-2 border border-gray-300 rounded-lg outline-none" /></div>
            
            {/* 圖片列表 */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">產品圖片集</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {images.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="w-3 h-3" /></button>
                    {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-1">封面圖</span>}
                  </div>
                ))}
                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  {isUploading ? <Loader2 className="w-6 h-6 text-gray-400 animate-spin" /> : <Plus className="w-6 h-6 text-gray-400" />}
                  <span className="text-xs text-gray-500 mt-1">{isUploading ? '上傳中' : '新增圖片'}</span>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} disabled={isUploading} />
                </label>
              </div>
            </div>

            <div><label className="block text-sm font-medium text-gray-700 mb-1">型號 (SKU)</label><input {...register('sku')} className="w-full p-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">系列</label><input {...register('series')} className="w-full p-2 border border-gray-300 rounded-lg outline-none" /></div>
          </div>
        </section>

        {/* 2. 價格與尺寸 */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-green-500 rounded-full"></div> 價格與尺寸</h2>
          <div className="grid grid-cols-3 gap-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">基礎價格</label><input type="number" {...register('basePrice', { valueAsNumber: true })} className="w-full p-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">標準寬度</label><input type="number" {...register('standardWidth', { valueAsNumber: true })} className="w-full p-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">標準高度</label><input type="number" {...register('standardHeight', { valueAsNumber: true })} className="w-full p-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div className="col-span-3 flex items-center gap-2 p-3 bg-gray-50 rounded-lg"><input type="checkbox" {...register('requiresMeasurement')} className="w-4 h-4 text-blue-600" /><label className="text-sm text-gray-700">需丈量 (勾選後前台會顯示「丈量並加入購物車」按鈕)</label></div>
          </div>
        </section>

        {/* ✨✨✨ 3. B2B 特殊折數 (新增區塊) ✨✨✨ */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Percent className="w-5 h-5 text-yellow-500" /> B2B 會員個別折數 (選填)</h2>
          <div className="grid grid-cols-2 gap-6 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <div>
              <label className="block text-sm font-bold text-yellow-800 mb-1">A 級會員折數</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="預設 (空白)" 
                {...register('discountA')} 
                className="w-full p-2 border border-yellow-200 rounded-lg outline-none focus:ring-2 focus:ring-yellow-400 bg-white" 
              />
              <p className="text-xs text-yellow-600 mt-1">例如：0.8 代表 8 折。若留空則使用系統統一設定。</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-yellow-800 mb-1">B 級會員折數</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="預設 (空白)" 
                {...register('discountB')} 
                className="w-full p-2 border border-yellow-200 rounded-lg outline-none focus:ring-2 focus:ring-yellow-400 bg-white" 
              />
              <p className="text-xs text-yellow-600 mt-1">例如：0.9 代表 9 折。</p>
            </div>
          </div>
        </section>

        {/* 4. 開門方向 */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between mb-4"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><MoveHorizontal className="w-5 h-5" /> 開門方向</h2><button type="button" onClick={() => appendOpening({ value: '' })} className="text-blue-600 text-sm flex items-center"><Plus className="w-4 h-4" /> 新增</button></div>
          <div className="grid grid-cols-2 gap-3">{openingFields.map((f, i) => (<div key={f.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border"><input {...register(`openingOptions.${i}.value`)} className="flex-1 bg-transparent outline-none text-sm" /><button type="button" onClick={() => removeOpening(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div>))}</div>
        </section>
        
        {/* 5. 顏色 */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between mb-4"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Palette className="w-5 h-5" /> 顏色</h2><button type="button" onClick={() => appendColor({ name: '', colorCode: '#000000', priceSurcharge: 0 })} className="text-blue-600 text-sm flex items-center"><Plus className="w-4 h-4" /> 新增</button></div>
          <div className="space-y-3">{colorFields.map((f, i) => (<div key={f.id} className="flex gap-3 items-end bg-gray-50 p-3 rounded-lg"><div className="flex-1"><input {...register(`colors.${i}.name`)} className="w-full p-2 border rounded text-sm" placeholder="名稱" /></div><div className="w-24"><input type="color" {...register(`colors.${i}.colorCode`)} className="h-9 w-9 border rounded cursor-pointer" /></div><div className="w-32"><input type="number" {...register(`colors.${i}.priceSurcharge`, { valueAsNumber: true })} className="w-full p-2 border rounded text-sm" placeholder="加價" /></div><button type="button" onClick={() => removeColor(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div>))}</div>
        </section>
        
        {/* 6. 材質 */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between mb-4"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Layers className="w-5 h-5" /> 材質</h2><button type="button" onClick={() => appendMaterial({ name: '', priceSurcharge: 0 })} className="text-blue-600 text-sm flex items-center"><Plus className="w-4 h-4" /> 新增</button></div>
          <div className="space-y-3">{materialFields.map((f, i) => (<div key={f.id} className="flex gap-3 items-end bg-gray-50 p-3 rounded-lg"><div className="flex-1"><input {...register(`materials.${i}.name`)} className="w-full p-2 border rounded text-sm" placeholder="名稱" /></div><div className="w-32"><input type="number" {...register(`materials.${i}.priceSurcharge`, { valueAsNumber: true })} className="w-full p-2 border rounded text-sm" placeholder="加價" /></div><button type="button" onClick={() => removeMaterial(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div>))}</div>
        </section>

      </div>
    </div>
  );
}
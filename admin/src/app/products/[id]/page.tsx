'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeft, Save, Plus, Trash2, DollarSign, Ruler, Palette, Layers, MoveHorizontal, Image as ImageIcon, Loader2, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

const CLOUDINARY_CLOUD_NAME = 'dnibj8za6'; 
const CLOUDINARY_PRESET = 'yasou70731';  

// ✨ 1. 定義明確的型別介面
interface ProductFormValues {
  name: string;
  sku: string;
  series: string;
  imageUrl: string;
  basePrice: number;
  requiresMeasurement: boolean;
  standardWidth: number;
  standardHeight: number;
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

  // ✨ 2. 在 useForm 中使用泛型 <ProductFormValues>
  const { register, control, handleSubmit, watch, setValue, reset } = useForm<ProductFormValues>({
    defaultValues: {
      name: '', sku: '', series: '', imageUrl: '',
      basePrice: 0, requiresMeasurement: true,
      standardWidth: 90, standardHeight: 210,
      colors: [],
      materials: [],
      openingOptions: []
    }
  });

  const imageUrl = watch('imageUrl');
  
  // ✨ 3. useFieldArray 也會自動推斷正確型別
  const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({ control, name: 'colors' });
  const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({ control, name: 'materials' });
  const { fields: openingFields, append: appendOpening, remove: removeOpening } = useFieldArray({ control, name: 'openingOptions' });

  // 1. 載入舊資料
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        const data = res.data;
        
        // 資料轉換
        const formattedData = {
          ...data,
          // 確保陣列存在，避免 null 錯誤
          colors: data.colors || [],
          materials: data.materials || [],
          openingOptions: data.openingOptions?.map((v: string) => ({ value: v })) || []
        };
        
        reset(formattedData);
      } catch (err) {
        console.error(err);
        alert('找不到產品資料');
        router.push('/products');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id, reset, router]);

  // 圖片上傳
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

  // 更新產品
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        // 轉回字串陣列
        openingOptions: data.openingOptions.map((opt) => opt.value).filter((v) => v)
      };
      await api.patch(`/products/${id}`, payload);
      alert('修改成功！');
      router.push('/products');
    } catch (error) {
      alert('修改失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex justify-center items-center">載入中...</div>;

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
        
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-blue-500 rounded-full"></div> 基本資訊</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">產品名稱</label><input {...register('name')} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">產品圖片</label>
              <div className="flex gap-6 items-start">
                <div className="flex-1">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">{isUploading ? <Loader2 className="animate-spin text-gray-400" /> : <UploadCloud className="text-gray-400" />}<span className="text-sm text-gray-500 mt-1">更換圖片</span></div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                </div>
                <div className="w-32 h-32 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : <ImageIcon className="text-gray-300" />}
                </div>
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">型號 (SKU)</label><input {...register('sku')} className="w-full p-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">系列</label><input {...register('series')} className="w-full p-2 border border-gray-300 rounded-lg outline-none" /></div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-green-500 rounded-full"></div> 價格與尺寸</h2>
          <div className="grid grid-cols-3 gap-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">基礎價格</label><input type="number" {...register('basePrice', { valueAsNumber: true })} className="w-full p-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">標準寬</label><input type="number" {...register('standardWidth', { valueAsNumber: true })} className="w-full p-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">標準高</label><input type="number" {...register('standardHeight', { valueAsNumber: true })} className="w-full p-2 border border-gray-300 rounded-lg outline-none" /></div>
            <div className="col-span-3 flex items-center gap-2 p-3 bg-gray-50 rounded-lg"><input type="checkbox" {...register('requiresMeasurement')} className="w-4 h-4 text-blue-600" /><label className="text-sm text-gray-700">需丈量</label></div>
          </div>
        </section>

        {/* 開門方向 */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between mb-4"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><MoveHorizontal className="w-5 h-5" /> 開門方向</h2><button type="button" onClick={() => appendOpening({ value: '' })} className="text-blue-600 text-sm flex items-center"><Plus className="w-4 h-4" /> 新增</button></div>
          <div className="grid grid-cols-2 gap-3">{openingFields.map((f, i) => (<div key={f.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border"><input {...register(`openingOptions.${i}.value`)} className="flex-1 bg-transparent outline-none text-sm" /><button type="button" onClick={() => removeOpening(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div>))}</div>
        </section>
        
        {/* 顏色 */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between mb-4"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Palette className="w-5 h-5" /> 顏色</h2><button type="button" onClick={() => appendColor({ name: '', colorCode: '#000000', priceSurcharge: 0 })} className="text-blue-600 text-sm flex items-center"><Plus className="w-4 h-4" /> 新增</button></div>
          <div className="space-y-3">{colorFields.map((f, i) => (<div key={f.id} className="flex gap-3 items-end bg-gray-50 p-3 rounded-lg"><div className="flex-1"><input {...register(`colors.${i}.name`)} className="w-full p-2 border rounded text-sm" placeholder="名稱" /></div><div className="w-24"><input type="color" {...register(`colors.${i}.colorCode`)} className="h-9 w-9 border rounded cursor-pointer" /></div><div className="w-32"><input type="number" {...register(`colors.${i}.priceSurcharge`, { valueAsNumber: true })} className="w-full p-2 border rounded text-sm" placeholder="加價" /></div><button type="button" onClick={() => removeColor(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div>))}</div>
        </section>
        
        {/* 材質 */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between mb-4"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Layers className="w-5 h-5" /> 材質</h2><button type="button" onClick={() => appendMaterial({ name: '', priceSurcharge: 0 })} className="text-blue-600 text-sm flex items-center"><Plus className="w-4 h-4" /> 新增</button></div>
          <div className="space-y-3">{materialFields.map((f, i) => (<div key={f.id} className="flex gap-3 items-end bg-gray-50 p-3 rounded-lg"><div className="flex-1"><input {...register(`materials.${i}.name`)} className="w-full p-2 border rounded text-sm" placeholder="名稱" /></div><div className="w-32"><input type="number" {...register(`materials.${i}.priceSurcharge`, { valueAsNumber: true })} className="w-full p-2 border rounded text-sm" placeholder="加價" /></div><button type="button" onClick={() => removeMaterial(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div>))}</div>
        </section>

      </div>
    </div>
  );
}
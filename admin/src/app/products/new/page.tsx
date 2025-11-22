'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeft, Save, Plus, Trash2, DollarSign, Ruler, Palette, Layers, MoveHorizontal, Image as ImageIcon, Loader2, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

// ✨ 這裡已經填入您提供的正確 Cloudinary 金鑰
const CLOUDINARY_CLOUD_NAME = 'dnibj8za6'; 
const CLOUDINARY_PRESET = 'yasou70731';  

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // 上傳狀態

  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      name: '', sku: '', series: '', imageUrl: '',
      basePrice: 0, requiresMeasurement: true,
      standardWidth: 90, standardHeight: 210,
      colors: [{ name: '標準黑', colorCode: '#000000', priceSurcharge: 0 }],
      materials: [{ name: '5mm 清玻', priceSurcharge: 0 }],
      openingOptions: [{ value: '左往右開' }, { value: '右往左開' }]
    }
  });

  const imageUrl = watch('imageUrl');
  const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({ control, name: 'colors' });
  const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({ control, name: 'materials' });
  const { fields: openingFields, append: appendOpening, remove: removeOpening } = useFieldArray({ control, name: 'openingOptions' });

  // ✨ 圖片上傳邏輯
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      if (data.secure_url) {
        setValue('imageUrl', data.secure_url); // 自動填入網址
      } 
    } catch (err) {
      console.error('上傳錯誤', err);
      alert('圖片上傳失敗！請確認 Cloudinary 設定是否正確。');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        openingOptions: data.openingOptions.map((opt: any) => opt.value).filter((v: string) => v)
      };
      await api.post('/products', payload);
      alert('產品建立成功！');
      router.push('/products');
    } catch (error) {
      console.error(error);
      alert('建立失敗，請檢查後端連線');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans pb-20">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/products" className="p-2 hover:bg-white rounded-full transition-colors text-gray-500">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">新增產品</h1>
            <p className="text-sm text-gray-500">設定產品規格、價格與客製化選項</p>
          </div>
        </div>
        <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md font-bold disabled:opacity-50 transition-all">
          <Save className="w-4 h-4" />
          {isSubmitting ? '儲存中...' : '儲存上架'}
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* 1. 基本資訊 */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            基本資訊
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">產品名稱</label>
              <input {...register('name', { required: true })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例如：極簡細框拉門 X2" />
            </div>
            
            {/* ✨ 圖片上傳區 */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">產品圖片</label>
              <div className="flex gap-6 items-start">
                {/* 上傳按鈕 */}
                <div className="flex-1">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-2" />
                      ) : (
                        <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                      )}
                      <p className="text-sm text-gray-500"><span className="font-semibold">點擊上傳</span> 或拖曳圖片至此</p>
                      <p className="text-xs text-gray-400">支援 PNG, JPG (自動上傳至 Cloudinary)</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                  {/* 隱藏的網址欄位 */}
                  <input {...register('imageUrl')} className="w-full mt-2 p-2 border border-gray-200 rounded text-xs text-gray-400 bg-gray-50" placeholder="圖片網址會自動填入..." readOnly />
                </div>

                {/* 圖片預覽 */}
                {/* ✨ 修正處：將 flex-shrink-0 改為 shrink-0 */}
                <div className="w-32 h-32 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                      <span className="text-xs text-gray-400">預覽圖</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">產品型號 (SKU)</label>
              <input {...register('sku', { required: true })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例如：SLIM-002" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所屬系列</label>
              <input {...register('series', { required: true })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例如：極簡系列" />
            </div>
          </div>
        </section>

        {/* 2. 價格與尺寸 */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-green-500 rounded-full"></div> 價格與尺寸規則</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">基礎價格</label>
              <div className="relative"><DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input type="number" {...register('basePrice', { valueAsNumber: true })} className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">標準寬度 (cm)</label>
              <div className="relative"><Ruler className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input type="number" {...register('standardWidth', { valueAsNumber: true })} className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">標準高度 (cm)</label>
              <div className="relative"><Ruler className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input type="number" {...register('standardHeight', { valueAsNumber: true })} className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" /></div>
            </div>
            <div className="col-span-3 flex items-center gap-2 p-3 bg-gray-50 rounded-lg"><input type="checkbox" {...register('requiresMeasurement')} id="reqMeasure" className="w-4 h-4 text-blue-600 rounded" /><label htmlFor="reqMeasure" className="text-sm text-gray-700 cursor-pointer">此產品為客製化尺寸 (前台顯示丈量表單)</label></div>
          </div>
        </section>

        {/* 3. 開門方向 */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><div className="w-1 h-6 bg-indigo-500 rounded-full"></div><MoveHorizontal className="w-5 h-5 text-indigo-500" /> 開門方向設定</h2>
            <button type="button" onClick={() => appendOpening({ value: '' })} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Plus className="w-4 h-4" /> 新增選項</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {openingFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-400 font-mono w-6 text-center">{index + 1}</span>
                <input {...register(`openingOptions.${index}.value`)} placeholder="例如：左往右開" className="flex-1 bg-transparent outline-none text-sm font-medium text-gray-700" />
                <button type="button" onClick={() => removeOpening(index)} className="p-2 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </section>

        {/* 4. 顏色 */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><div className="w-1 h-6 bg-purple-500 rounded-full"></div><Palette className="w-5 h-5 text-purple-500" /> 顏色選項</h2>
            <button type="button" onClick={() => appendColor({ name: '', colorCode: '#000000', priceSurcharge: 0 })} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Plus className="w-4 h-4" /> 新增顏色</button>
          </div>
          <div className="space-y-3">
            {colorFields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-end bg-gray-50 p-3 rounded-lg">
                <div className="flex-1"><label className="text-xs text-gray-500 mb-1 block">顏色名稱</label><input {...register(`colors.${index}.name`)} placeholder="e.g. 消光黑" className="w-full p-2 border border-gray-300 rounded text-sm" /></div>
                <div className="w-24"><label className="text-xs text-gray-500 mb-1 block">色碼 (Hex)</label><div className="flex items-center gap-2"><input type="color" {...register(`colors.${index}.colorCode`)} className="h-9 w-9 p-0 border-0 rounded cursor-pointer" /></div></div>
                <div className="w-32"><label className="text-xs text-gray-500 mb-1 block">加價 ($)</label><input type="number" {...register(`colors.${index}.priceSurcharge`, { valueAsNumber: true })} className="w-full p-2 border border-gray-300 rounded text-sm" /></div>
                <button type="button" onClick={() => removeColor(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded mb-0.5"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </section>

        {/* 5. 材質 */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><div className="w-1 h-6 bg-orange-500 rounded-full"></div><Layers className="w-5 h-5 text-orange-500" /> 材質/玻璃選項</h2>
            <button type="button" onClick={() => appendMaterial({ name: '', priceSurcharge: 0 })} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Plus className="w-4 h-4" /> 新增材質</button>
          </div>
          <div className="space-y-3">
            {materialFields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-end bg-gray-50 p-3 rounded-lg">
                <div className="flex-1"><label className="text-xs text-gray-500 mb-1 block">材質名稱</label><input {...register(`materials.${index}.name`)} placeholder="e.g. 長虹玻璃" className="w-full p-2 border border-gray-300 rounded text-sm" /></div>
                <div className="w-32"><label className="text-xs text-gray-500 mb-1 block">加價 ($)</label><input type="number" {...register(`materials.${index}.priceSurcharge`, { valueAsNumber: true })} className="w-full p-2 border border-gray-300 rounded text-sm" /></div>
                <button type="button" onClick={() => removeMaterial(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded mb-0.5"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
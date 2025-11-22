'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Ruler, AlertTriangle, Check } from 'lucide-react';
import clsx from 'clsx';

// 1. 定義驗證規則 (Schema)
const measurementSchema = z.object({
  width: z.object({
    top: z.number().min(10, '太窄'),
    mid: z.number().min(10, '太窄'),
    bot: z.number().min(10, '太窄'),
  }),
  height: z.object({
    left: z.number().min(10, '太低'),
    mid: z.number().min(10, '太低'),
    right: z.number().min(10, '太低'),
  }),
  isCeilingMounted: z.boolean(),
  hasFloorError: z.boolean(),
  hasWallError: z.boolean(),
  floorError: z.object({ left: z.number(), mid: z.number(), right: z.number() }).optional(),
});

export type MeasurementData = z.infer<typeof measurementSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: MeasurementData) => void;
}

export default function MeasurementModal({ isOpen, onClose, onConfirm }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<MeasurementData>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      isCeilingMounted: true,
      hasFloorError: false,
      hasWallError: false,
      width: { top: 0, mid: 0, bot: 0 },
      height: { left: 0, mid: 0, right: 0 },
    }
  });

  const showFloorError = watch('hasFloorError');

  if (!isOpen) return null;

  const onSubmit = (data: MeasurementData) => {
    onConfirm(data);
    onClose(); // 提交後關閉
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-2 text-blue-900">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Ruler className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">工程丈量輸入</h3>
              <p className="text-xs text-gray-500">請輸入現場實量數據 (mm)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <form id="measure-form" onSubmit={handleSubmit(onSubmit)}>
            
            {/* 寬度 */}
            <section>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">1</span>
                寬度測量 (Width)
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {['top', 'mid', 'bot'].map((pos) => (
                  <div key={pos} className="space-y-1">
                    <label className="text-xs text-gray-500 uppercase font-bold text-center block">
                      {pos === 'top' ? '上寬' : pos === 'mid' ? '中寬' : '下寬'}
                    </label>
                    <input
                      type="number"
                      {...register(`width.${pos as 'top'|'mid'|'bot'}`, { valueAsNumber: true })}
                      className="w-full p-3 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              {errors.width && <p className="text-red-500 text-xs mt-2 text-center">請完整輸入三點寬度</p>}
            </section>

            {/* 高度 */}
            <section>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">2</span>
                高度測量 (Height)
              </h4>
              <div className="flex items-center gap-2 mb-4 bg-blue-50 p-3 rounded-lg">
                <input type="checkbox" {...register('isCeilingMounted')} id="ceiling" className="w-4 h-4 text-blue-600 rounded" />
                <label htmlFor="ceiling" className="text-sm font-medium text-blue-900 cursor-pointer">是否封頂 (頂天立地)</label>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {['left', 'mid', 'right'].map((pos) => (
                  <div key={pos} className="space-y-1">
                    <label className="text-xs text-gray-500 uppercase font-bold text-center block">
                      {pos === 'left' ? '左高' : pos === 'mid' ? '中高' : '右高'}
                    </label>
                    <input
                      type="number"
                      {...register(`height.${pos as 'left'|'mid'|'right'}`, { valueAsNumber: true })}
                      className="w-full p-3 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              {errors.height && <p className="text-red-500 text-xs mt-2 text-center">請完整輸入三點高度</p>}
            </section>

            <hr className="border-gray-100" />

            {/* 環境誤差 */}
            <section>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                <span className="w-6 h-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs mr-2">3</span>
                環境誤差 (選填)
              </h4>
              <div className={clsx("border rounded-xl p-4 transition-all", showFloorError ? "border-amber-400 bg-amber-50" : "border-gray-200")}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('hasFloorError')} className="w-4 h-4 text-amber-500 rounded" />
                    <span className={clsx("text-sm font-bold", showFloorError ? "text-amber-800" : "text-gray-600")}>地面有水平誤差 (高低差)</span>
                  </label>
                  {showFloorError && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                </div>
                {showFloorError && (
                  <div className="mt-4 grid grid-cols-3 gap-4 animate-in fade-in">
                    {['left', 'mid', 'right'].map((pos) => (
                      <div key={pos}>
                        <label className="text-[10px] text-amber-700/70 uppercase font-bold text-center block mb-1">{pos} (mm)</label>
                        <input type="number" {...register(`floorError.${pos as 'left'|'mid'|'right'}`, { valueAsNumber: true })} className="w-full p-2 text-center border border-amber-200 rounded bg-white focus:ring-2 focus:ring-amber-500 outline-none font-mono text-sm" placeholder="+/-" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg">取消</button>
          <button type="submit" form="measure-form" className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center">
            <Check className="w-4 h-4 mr-2" />
            確認數據
          </button>
        </div>
      </div>
    </div>
  );
}
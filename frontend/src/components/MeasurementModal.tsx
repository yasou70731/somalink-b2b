'use client';

import { useState, useEffect } from 'react';
// ✅ 修正：移除未使用的 AlertTriangle
import { X, Info, Check } from 'lucide-react';
import clsx from 'clsx';

export interface MeasurementData {
  width: { top: number; mid: number; bot: number };
  height: { left: number; mid: number; right: number; singleValue?: number };
  isCeilingMounted: boolean;
  floorError?: { diff: number; description?: string };
}

interface MeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: MeasurementData) => void;
}

export default function MeasurementModal({ isOpen, onClose, onConfirm }: MeasurementModalProps) {
  const [step, setStep] = useState(1); // 1: 尺寸輸入, 2: 環境評估
  
  // 尺寸數據
  const [width, setWidth] = useState({ top: '', mid: '', bot: '' });
  const [height, setHeight] = useState({ left: '', mid: '', right: '' });
  const [isCeilingMounted, setIsCeilingMounted] = useState(true);

  // 環境數據
  const [hasFloorError, setHasFloorError] = useState(false); 
  const [floorDiff, setFloorDiff] = useState('');

  // 初始化 / 重置
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setWidth({ top: '', mid: '', bot: '' });
      setHeight({ left: '', mid: '', right: '' });
      setIsCeilingMounted(true);
      setHasFloorError(false); // 預設為完美狀況
      setFloorDiff('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    // 簡單驗證尺寸是否填寫
    if (!width.top || !width.mid || !width.bot || !height.left || !height.mid || !height.right) {
      alert('請填寫完整的寬度與高度數據 (共 6 個欄位)');
      return;
    }
    setStep(2);
  };

  const handleConfirm = () => {
    // 驗證邏輯修正：只有在「有誤差」且「未填寫數值」時才擋下
    if (hasFloorError && !floorDiff) {
      alert('您勾選了有地面高低差，請輸入誤差數值');
      return;
    }

    const data: MeasurementData = {
      width: {
        top: Number(width.top),
        mid: Number(width.mid),
        bot: Number(width.bot),
      },
      height: {
        left: Number(height.left),
        mid: Number(height.mid),
        right: Number(height.right),
      },
      isCeilingMounted,
      // 如果無誤差，floorError 就給 undefined
      floorError: hasFloorError ? { diff: Number(floorDiff) } : undefined
    };

    onConfirm(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* 標題列 */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-900">
            {step === 1 ? '步驟 1/2：輸入丈量尺寸' : '步驟 2/2：環境評估'}
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 內容區 */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {step === 1 && (
            <>
              {/* 寬度輸入區 */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">寬度測量 (Width) <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-3">
                  {['top', 'mid', 'bot'].map((pos) => (
                    <div key={pos}>
                      <input 
                        type="number" 
                        placeholder={pos === 'top' ? '上' : pos === 'mid' ? '中' : '下'}
                        value={width[pos as keyof typeof width]}
                        onChange={(e) => setWidth({ ...width, [pos]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">請分別測量 上/中/下 三點寬度 (單位: cm)</p>
              </div>

              {/* 高度輸入區 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-gray-700">高度測量 (Height) <span className="text-red-500">*</span></label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={isCeilingMounted}
                      onChange={(e) => setIsCeilingMounted(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">封頂安裝</span>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['left', 'mid', 'right'].map((pos) => (
                    <div key={pos}>
                      <input 
                        type="number" 
                        placeholder={pos === 'left' ? '左' : pos === 'mid' ? '中' : '右'}
                        value={height[pos as keyof typeof height]}
                        onChange={(e) => setHeight({ ...height, [pos]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">請分別測量 左/中/右 三點高度 (單位: cm)</p>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 text-blue-800 text-sm border border-blue-100">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <p>請確認現場地面是否有高低差。若牆面/地面垂直水平良好，請選擇第一項。</p>
              </div>

              <div className="space-y-3">
                
                {/* 選項 1: 完美無誤差 (預設) */}
                <label className={clsx(
                  "flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all",
                  !hasFloorError ? "border-green-500 bg-green-50 ring-1 ring-green-500" : "border-gray-200 hover:bg-gray-50"
                )}>
                  <input 
                    type="radio" 
                    name="floor_condition"
                    checked={!hasFloorError}
                    onChange={() => {
                      setHasFloorError(false);
                      setFloorDiff('');
                    }}
                    className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-gray-900 block">✅ 垂直水平良好 (無誤差)</span>
                    <span className="text-xs text-gray-500">現場條件標準，不需要特殊調整</span>
                  </div>
                </label>

                {/* 選項 2: 有誤差 */}
                <label className={clsx(
                  "flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all",
                  hasFloorError ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500" : "border-gray-200 hover:bg-gray-50"
                )}>
                  <input 
                    type="radio" 
                    name="floor_condition"
                    checked={hasFloorError}
                    onChange={() => setHasFloorError(true)}
                    className="w-5 h-5 text-orange-600 border-gray-300 focus:ring-orange-500 mt-1"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-gray-900 block">⚠️ 有地面高低差 (水平誤差)</span>
                    <span className="text-xs text-gray-500 mb-2 block">左右高度不一致，需填寫誤差值</span>
                    
                    {/* 輸入框只在勾選時出現 */}
                    {hasFloorError && (
                      <div className="mt-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-sm font-bold text-gray-700 whitespace-nowrap">高低落差：</label>
                        <input 
                          type="number" 
                          value={floorDiff}
                          onChange={(e) => setFloorDiff(e.target.value)}
                          placeholder="0.5"
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                          autoFocus
                        />
                        <span className="text-sm text-gray-500">cm</span>
                      </div>
                    )}
                  </div>
                </label>

              </div>
            </div>
          )}

        </div>

        {/* 底部按鈕 */}
        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          {step === 2 && (
            <button 
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              上一步
            </button>
          )}
          <button 
            onClick={step === 1 ? handleNext : handleConfirm}
            className="px-8 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-colors shadow-lg flex items-center gap-2"
          >
            {step === 1 ? '下一步' : <><Check className="w-4 h-4" /> 完成並加入</>}
          </button>
        </div>

      </div>
    </div>
  );
}
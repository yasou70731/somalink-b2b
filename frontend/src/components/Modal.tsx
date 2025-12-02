'use client';

import { X, CheckCircle, AlertCircle, HelpCircle, Info } from 'lucide-react';
import clsx from 'clsx';
import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: ReactNode; // 支援文字或 JSX
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function Modal({ 
  isOpen, onClose, title, message, type = 'info', onConfirm, confirmText = '確定', cancelText = '取消' 
}: ModalProps) {
  if (!isOpen) return null;

  const iconMap = {
    success: <CheckCircle className="w-12 h-12 text-green-500" />,
    error: <AlertCircle className="w-12 h-12 text-red-500" />,
    warning: <AlertCircle className="w-12 h-12 text-orange-500" />,
    info: <Info className="w-12 h-12 text-blue-500" />,
    confirm: <HelpCircle className="w-12 h-12 text-blue-500" />,
  };

  return (
    // ✨ Fix: 將 z-[999] 改為 z-999 (Tailwind v4 標準寫法)
    <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200 relative">
        
        {/* 關閉按鈕 */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        {/* 圖示 */}
        <div className="mb-2 scale-110">
          {iconMap[type]}
        </div>
        
        {/* 標題與內容 */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          {message && <div className="text-sm text-gray-600 leading-relaxed">{message}</div>}
        </div>
        
        {/* 按鈕區 */}
        <div className="flex w-full gap-3 mt-4">
          {type === 'confirm' ? (
            <>
              <button 
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                {cancelText}
              </button>
              <button 
                onClick={() => { onConfirm?.(); onClose(); }}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md"
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button 
              onClick={onClose}
              className={clsx(
                "w-full py-2.5 rounded-xl font-bold text-white transition-colors shadow-md",
                type === 'error' ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
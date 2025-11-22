'use client';

import { usePathname } from 'next/navigation';
import Sidebar from "@/components/Sidebar";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 定義「不需要側邊欄」的頁面
  // 包含登入頁、以及所有列印頁面
  const isFullScreenPage = 
    pathname === '/login' || 
    pathname.includes('/print');

  if (isFullScreenPage) {
    // 全螢幕模式 (只有內容，沒有 Sidebar)
    return <div className="w-full h-full">{children}</div>;
  }

  // 一般後台模式 (有 Sidebar)
  return (
    <div className="flex min-h-screen font-sans">
      <Sidebar />
      <div className="flex-1 md:ml-64 transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Package, Users, Settings, LogOut, Layers, BarChart3, ClipboardList } from "lucide-react"; // ✨ 新增 ClipboardList

export default function Sidebar() {
  const router = useRouter();

  const handleLogout = () => {
    if (confirm('確定要登出管理後台嗎？')) {
      localStorage.removeItem('somalink_admin_token');
      localStorage.removeItem('somalink_admin_user');
      window.location.href = '/login';
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-white shrink-0 hidden md:flex flex-col fixed inset-y-0 left-0 z-50">
      
      {/* Logo 區 */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 shadow-md bg-slate-900">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg mr-3 shadow-blue-900/20">
          S
        </div>
        <span className="font-bold text-lg tracking-wide">松成有限公司</span>
      </div>

      {/* 選單連結區 */}
      <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto">
        <Link 
          href="/" 
          className="flex items-center px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors group"
        >
          <LayoutDashboard className="w-5 h-5 mr-3 group-hover:text-blue-400 transition-colors" />
          订單戰情室
        </Link>

        <Link 
          href="/reports" 
          className="flex items-center px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors group"
        >
          <BarChart3 className="w-5 h-5 mr-3 group-hover:text-blue-400 transition-colors" />
          營運報表
        </Link>

        <Link 
          href="/products" 
          className="flex items-center px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors group"
        >
          <Package className="w-5 h-5 mr-3 group-hover:text-blue-400 transition-colors" />
          產品管理
        </Link>

        <Link 
          href="/series" 
          className="flex items-center px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors group"
        >
          <Layers className="w-5 h-5 mr-3 group-hover:text-blue-400 transition-colors" />
          系列管理
        </Link>

        <Link 
          href="/users" 
          className="flex items-center px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors group"
        >
          <Users className="w-5 h-5 mr-3 group-hover:text-blue-400 transition-colors" />
          會員管理
        </Link>

        {/* ✨ 新增：系統日誌 */}
        <Link 
          href="/logs" 
          className="flex items-center px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors group"
        >
          <ClipboardList className="w-5 h-5 mr-3 group-hover:text-blue-400 transition-colors" />
          系統日誌
        </Link>

        <div className="pt-4 mt-4 border-t border-slate-800">
          <Link 
            href="/settings" 
            className="flex items-center px-3 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 mr-3" />
            系統設定
          </Link>
        </div>
      </nav>

      {/* 底部使用者資訊 & 登出按鈕 */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg font-bold text-sm">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Admin</p>
            <p className="text-xs text-slate-500 truncate">超級管理員</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 hover:bg-slate-800 p-2 rounded-md transition-all"
            title="登出系統"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
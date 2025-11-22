'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, ShoppingCart, User, LogOut, Megaphone, X } from "lucide-react";
import { api } from '../lib/api';

// 假資料 (系列櫥窗)
const SERIES_DATA = [
  {
    id: "極簡系列",
    name: "極簡細框系列",
    description: "Modern Slim",
    priceStart: 5000,
    image: "https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "經典系列",
    name: "經典寬框系列",
    description: "Classic Bold",
    priceStart: 4500,
    image: "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "淋浴系列",
    name: "淋浴拉門系列",
    description: "Shower Doors",
    priceStart: 8000,
    image: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "懸浮系列",
    name: "懸浮無軌系列",
    description: "Magnetic Levitation",
    priceStart: 12000,
    image: "https://images.unsplash.com/photo-1486946255434-2466348c2166?auto=format&fit=crop&q=80&w=800",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('somalink_user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) {}
    }

    const fetchAnnouncement = async () => {
      try {
        const res = await api.get('/announcements/active');
        if (res.data) {
          setAnnouncement(res.data.content);
        }
      } catch (err) { console.error(err); }
    };
    fetchAnnouncement();
  }, []);

  const handleLogout = () => {
    if (confirm('確定要登出嗎？')) {
      localStorage.removeItem('somalink_token');
      localStorage.removeItem('somalink_user');
      setUser(null);
      router.refresh();
    }
  };

  const handleCartClick = () => {
    const token = localStorage.getItem('somalink_token');
    if (!token) { router.push('/login'); } else { router.push('/orders'); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {announcement && showBanner && (
        <div className="bg-blue-600 text-white px-4 py-3 relative flex justify-center items-center animate-in slide-in-from-top">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Megaphone className="w-4 h-4 animate-pulse" />
            <span>{announcement}</span>
          </div>
          <button onClick={() => setShowBanner(false)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-blue-700 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">S</div>
            {/* ✨ 修改這裡：改成 松成有限公司 */}
            <span className="text-xl font-bold text-gray-900">松成有限公司</span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <input type="text" placeholder="搜尋產品型號..." className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-full focus:bg-white focus:border-blue-500 focus:ring-0 transition-all outline-none text-sm" />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-4 text-gray-600">
            <button onClick={handleCartClick} className="p-2 hover:bg-gray-100 rounded-full relative transition-colors" title="我的訂單">
              <ShoppingCart className="w-6 h-6" />
              {user && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
            </button>

            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-400">歡迎回來</p>
                  <p className="text-sm font-bold text-gray-900 truncate max-w-[100px]">{user.dealerProfile?.companyName || user.email}</p>
                </div>
                <button onClick={handleLogout} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors" title="登出">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-2 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-gray-500" /></div>
                <span className="text-sm font-medium hidden sm:block text-gray-700">登入 / 註冊</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* ✨ 修改這裡：改成 松成有限公司 */}
          <h1 className="text-2xl font-bold text-gray-900">歡迎來到 松成有限公司 數位工廠</h1>
          <p className="text-gray-500 mt-1">請選擇下方產品系列，開始建立您的客製化報價單</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {SERIES_DATA.map((series) => (
            <Link key={series.id} href={`/series/${encodeURIComponent(series.name)}`} className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col">
              <div className="relative h-52 overflow-hidden bg-gray-100">
                <img src={series.image} alt={series.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-60" />
                <div className="absolute bottom-4 left-4 text-white"><p className="text-xs font-medium opacity-90 tracking-wider uppercase">{series.description}</p><h3 className="text-lg font-bold">{series.name}</h3></div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2"><span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">B2B 專屬</span></div>
                  <p className="text-gray-500 text-sm line-clamp-2">支援高度客製化尺寸、顏色與玻璃配置。</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div><p className="text-xs text-gray-400">基礎價格</p><p className="text-blue-600 font-bold text-lg">${series.priceStart.toLocaleString()} <span className="text-xs text-gray-400 font-normal ml-1">起</span></p></div>
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors"><ArrowRight className="w-5 h-5" /></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from 'next/image'; // ✨ 引入
import { ArrowRight, Megaphone, X, Loader2 } from "lucide-react";
import { api } from '../../lib/api'; 

export default function HomePage() {
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const annRes = await api.get('/announcements/active');
        if (annRes && annRes.content) setAnnouncement(annRes.content);

        const seriesRes = await api.get('/series');
        const data = Array.isArray(seriesRes) ? seriesRes : [];
        const activeSeries = data.filter((s: any) => s.isActive);
        setSeriesList(activeSeries);
      } catch (err) { 
        console.error('無法取得首頁資料', err); 
        setSeriesList([]); 
      } finally {
        setLoadingSeries(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      
      {announcement && showBanner && (
        <div className="bg-blue-600 text-white px-4 py-2.5 relative flex justify-center items-center text-xs sm:text-sm font-medium animate-in slide-in-from-top">
          <div className="flex items-center gap-2"><Megaphone className="w-4 h-4 animate-pulse" /><span>{announcement}</span></div>
          <button onClick={() => setShowBanner(false)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-blue-700 rounded-full transition-colors opacity-80 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">歡迎來到 松成有限公司 數位工廠</h1>
          <p className="text-gray-500">請選擇下方產品系列，開始建立您的客製化報價單</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loadingSeries ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-blue-600" /></div>
        ) : seriesList.length === 0 ? (
          <div className="text-center py-20 text-gray-500">尚無上架系列，請至後台新增。</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {seriesList.map((series) => (
              <Link 
                key={series.id} 
                href={`/series/${encodeURIComponent(series.name)}`} 
                className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col"
              >
                <div className="relative h-52 overflow-hidden bg-gray-100">
                  {/* ✨ 改用 Next.js Image */}
                  <Image 
                    src={series.imageUrl || "https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800"} 
                    alt={series.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-60" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-xs font-medium opacity-90 tracking-wider uppercase">{series.description}</p>
                    <h3 className="text-lg font-bold">{series.displayName || series.name}</h3>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">B2B 專屬</span>
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-2">支援高度客製化尺寸、顏色與玻璃配置。</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div><p className="text-xs text-gray-400">基礎價格</p><p className="text-blue-600 font-bold text-lg">${series.priceStart?.toLocaleString()} <span className="text-xs text-gray-400 font-normal ml-1">起</span></p></div>
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors"><ArrowRight className="w-5 h-5" /></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
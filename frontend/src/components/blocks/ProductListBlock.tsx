'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface Series {
  id: string;
  name: string;
  displayName?: string;
  imageUrl: string;
  isActive: boolean;
}

interface ProductListData {
  title: string;
  count?: number;
}

// ❌ 定義已知失效的圖片 ID (黑名單)
const BROKEN_IMAGE_ID = "photo-1584622050111-993a426fbf0a";

// ✅ 定義安全的預設替代圖片
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800";

export default function ProductListBlock({ data }: { data: ProductListData }) {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✨ 修改：加入時間戳記 (timestamp) 來強制瀏覽器抓取最新資料，避開快取
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api.get<any[]>(`/series?_t=${new Date().getTime()}`).then((res) => {
      const list = Array.isArray(res) ? res : [];
      const typedList = list as Series[];
      setSeriesList(typedList.filter((s) => s.isActive).slice(0, data.count || 4));
    }).finally(() => setLoading(false));
  }, [data.count]);

  return (
    <section className="py-20 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12"><h2 className="text-2xl font-bold text-gray-900">{data.title}</h2></div>
        {loading ? <div className="flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {seriesList.map((series) => {
              // ✨ 檢查圖片是否有效，如果網址包含失效ID，就換成備用圖
              const validImageUrl = (series.imageUrl && !series.imageUrl.includes(BROKEN_IMAGE_ID))
                ? series.imageUrl
                : FALLBACK_IMAGE;

              return (
                <Link 
                  key={series.id} 
                  href={`/series/${encodeURIComponent(series.name)}`} 
                  className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-900 hover:-translate-y-1"
                >
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <Image 
                      src={validImageUrl} 
                      alt={series.name} 
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent opacity-60" />
                    
                    <div className="absolute bottom-3 left-3 text-white">
                      <h3 className="text-lg font-bold group-hover:text-blue-100 transition-colors">{series.displayName || series.name}</h3>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
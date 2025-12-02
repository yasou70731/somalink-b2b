'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function ProductListBlock({ data }: { data: any }) {
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/series').then((res) => {
      const list = Array.isArray(res) ? res : [];
      setSeriesList(list.filter((s: any) => s.isActive).slice(0, data.count || 4));
    }).finally(() => setLoading(false));
  }, [data.count]);

  return (
    <section className="py-20 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12"><h2 className="text-2xl font-bold text-gray-900">{data.title}</h2></div>
        {loading ? <div className="flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {seriesList.map((series) => (
              <Link 
                key={series.id} 
                href={`/series/${encodeURIComponent(series.name)}`} 
                // ✨ 修改重點：加入 border-2 border-transparent hover:border-blue-900 (海軍藍邊框)
                className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-900 hover:-translate-y-1"
              >
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={series.imageUrl} alt={series.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent opacity-60" />
                  
                  {/* 文字也稍微放大一點增加對比 */}
                  <div className="absolute bottom-3 left-3 text-white">
                    <h3 className="text-lg font-bold group-hover:text-blue-100 transition-colors">{series.displayName || series.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
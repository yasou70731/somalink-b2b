'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // ✅ 引入 Next Image
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

// ✅ 定義型別
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

export default function ProductListBlock({ data }: { data: ProductListData }) {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api.get<any[]>('/series').then((res) => {
      const list = Array.isArray(res) ? res : [];
      // ✅ 轉型為 Series[]
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
            {seriesList.map((series) => (
              <Link 
                key={series.id} 
                href={`/series/${encodeURIComponent(series.name)}`} 
                className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-900 hover:-translate-y-1"
              >
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  {/* ✅ 改用 Next Image */}
                  <Image 
                    src={series.imageUrl} 
                    alt={series.name} 
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  {/* ✨ 修正：更新為 bg-linear-to-t 以符合 Tailwind 新語法建議 */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent opacity-60" />
                  
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
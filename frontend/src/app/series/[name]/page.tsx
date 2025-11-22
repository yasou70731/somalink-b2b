'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, ShoppingCart } from 'lucide-react';
import { api } from '@/lib/api';

// 這裡是用來過濾產品的頁面
export default function SeriesListPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  // 因為網址上的中文會被編碼 (變成 %E6%A5...)，所以要解碼回來
  const seriesName = decodeURIComponent(name);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // 呼叫後端抓所有產品
        const res = await api.get('/products');
        // 前端過濾：只顯示「目前這個系列」的產品
        // (注意：後台新增產品時，系列名稱要打一樣的，例如 "極簡系列")
        const filtered = res.data.filter((p: any) => p.series === seriesName);
        setProducts(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [seriesName]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 h-16 flex items-center px-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto w-full flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">{seriesName}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">載入產品中...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">此系列尚無產品</h3>
            <p className="text-gray-500 mt-1">請至後台新增產品，並確認系列名稱為「{seriesName}」</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link 
                key={product.id} 
                href={`/product/${product.id}`} // ✨ 點擊後連到我們剛剛搬家的詳情頁
                className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 flex flex-col"
              >
                {/* 產品封面圖 */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  {/* 如果後端有存圖片就顯示，沒有就顯示假圖 */}
                  <img 
                    src={product.imageUrl || "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?auto=format&fit=crop&q=80&w=800"} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                {/* 產品資訊 */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                  <p className="text-xs text-gray-500 font-mono mb-3">{product.sku}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-blue-600 font-bold">${Number(product.basePrice).toLocaleString()} 起</span>
                    <button className="p-2 bg-gray-50 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <ShoppingCart className="w-4 h-4" />
                    </button>
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
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, ShoppingCart, Lock } from 'lucide-react'; // ✨ 新增 Lock 圖示
import { api } from '@/lib/api';
import Modal from '@/components/Modal'; // ✨ 引入彈窗

export default function SeriesListPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const seriesName = decodeURIComponent(name);
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✨ 登入提示彈窗狀態
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        const data = Array.isArray(res) ? res : [];
        const filtered = data.filter((p: any) => p.series === seriesName);
        setProducts(filtered);
      } catch (err) {
        console.error(err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [seriesName]);

  // ✨✨✨ 點擊商品時的檢查邏輯 ✨✨✨
  const handleProductClick = (productId: string) => {
    // 檢查 LocalStorage 或 SessionStorage 是否有 Token
    const token = localStorage.getItem('somalink_token') || sessionStorage.getItem('somalink_token');
    
    if (!token) {
      // 沒登入 -> 跳出彈窗
      setShowLoginModal(true);
    } else {
      // 有登入 -> 正常跳轉
      router.push(`/product/${productId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* ✨ 提示彈窗 */}
      <Modal 
        isOpen={showLoginModal} 
        title="會員專屬權限"
        message="本站採會員制，請先登入會員帳號，即可查看完整產品規格與專屬優惠價格。"
        type="confirm"
        confirmText="前往登入"
        cancelText="稍後再說"
        onClose={() => setShowLoginModal(false)}
        onConfirm={() => router.push('/login')}
      />

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
            {products.map((product) => {
              const thumb = (product.images && product.images.length > 0) 
                ? product.images[0] 
                : (product.imageUrl || "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?auto=format&fit=crop&q=80&w=800");

              return (
                <div 
                  key={product.id} 
                  // ✨ 改用 onClick 觸發檢查，而不是直接 Link
                  onClick={() => handleProductClick(product.id)}
                  className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 flex flex-col cursor-pointer relative"
                >
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={thumb} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                    <p className="text-xs text-gray-500 font-mono mb-3">{product.sku}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-blue-600 font-bold flex items-center gap-1">
                        ${Number(product.basePrice).toLocaleString()} 起
                      </span>
                      <button className="p-2 bg-gray-50 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
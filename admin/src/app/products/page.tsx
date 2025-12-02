'use client';

import { useEffect, useState } from 'react';
import { Plus, Package, Edit, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    try {
      // ✨ 修正：直接使用 res，不要再寫 .data (因為 api.ts 已處理)
      const res = await api.get('/products');
      
      if (Array.isArray(res)) {
        setProducts(res);
      } else {
        console.warn('API 回傳格式異常:', res);
        setProducts([]);
      }
    } catch (err) { 
      console.error('無法取得產品列表:', err);
      setProducts([]); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此產品嗎？(此操作無法復原)')) return;
    try {
      await api.delete(`/products/${id}`);
      alert('刪除成功');
      fetchProducts(); // 重整列表
    } catch (err) {
      alert('刪除失敗');
    }
  };

  // 簡單的前端搜尋過濾
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" /> 產品管理
          </h1>
          <p className="text-gray-500 text-sm mt-1">管理所有上架的門款、價格與客製化選項</p>
        </div>
        <Link href="/products/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-bold">
          <Plus className="w-5 h-5" /> 新增產品
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜尋產品名稱或型號..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">圖片</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">產品資訊</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">系列</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">基礎價格</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">尺寸規格</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-500">載入中...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-500">尚無產品</td></tr>
            ) : (
              filteredProducts.map((product) => {
                // ✨ 圖片顯示邏輯：優先用新陣列的第一張，沒有就用舊欄位，再沒有就顯示圖示
                const thumb = product.images?.[0] || product.imageUrl;

                return (
                  <tr key={product.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{product.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-gray-100 text-xs text-gray-600 border border-gray-200">
                        {product.series}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-600 font-mono">
                      ${Number(product.basePrice).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {product.standardWidth} x {product.standardHeight}
                      {product.requiresMeasurement && <span className="ml-2 text-xs text-orange-500 bg-orange-50 px-1 rounded">客製</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <Link href={`/products/${product.id}`} className="text-gray-400 hover:text-blue-600 transition-colors" title="編輯">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(product.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="刪除">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
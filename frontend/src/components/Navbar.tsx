'use client';

import Link from 'next/link';
import { ShoppingCart, Package } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { cartCount } = useCart();
  const [mounted, setMounted] = useState(false);

  // 避免 Hydration Mismatch (因為 localStorage 在 server 端讀不到)
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Package className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">SomaLink</span>
          </Link>

          {/* 右側選單 */}
          <div className="flex items-center gap-6">
            <Link href="/orders" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              歷史訂單
            </Link>

            {/* 購物車按鈕 */}
            <Link href="/cart" className="relative p-2 rounded-full hover:bg-gray-100 group transition-colors">
              <ShoppingCart className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
              {mounted && cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
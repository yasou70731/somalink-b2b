'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 定義購物車內的單項商品結構 (對應後端的 OrderItem)
export interface CartItem {
  internalId: string; // 前端專用的唯一 ID (用來刪除用)
  productId: string;
  productName: string; // 顯示用
  unitPrice: number;   // 單價
  
  // --- 規格資料 ---
  serviceType: string;
  widthMatrix: { top: number; mid: number; bot: number };
  heightData: any;
  isCeilingMounted: boolean;
  siteConditions?: any;
  colorName: string;
  materialName: string;
  openingDirection: string;
  hasThreshold: boolean;
  
  // --- 數量與價格 ---
  quantity: number;
  subtotal: number;
  priceSnapshot: any; // 完整的價格結構
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (internalId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // (選配) 初始化時從 localStorage 讀取，避免重整後消失
  useEffect(() => {
    const saved = localStorage.getItem('soma_cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  // 每次變動都存回 localStorage
  useEffect(() => {
    localStorage.setItem('soma_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (newItem: CartItem) => {
    setItems((prev) => [...prev, newItem]);
  };

  const removeFromCart = (internalId: string) => {
    setItems((prev) => prev.filter((item) => item.internalId !== internalId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartTotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <CartContext.Provider 
      value={{ 
        items, 
        addToCart, 
        removeFromCart, 
        clearCart,
        cartCount: items.length,
        cartTotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
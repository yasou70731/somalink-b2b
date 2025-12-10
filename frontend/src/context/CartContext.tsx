'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

// ✅ 定義通用物件型別，取代 any
type JsonObject = Record<string, unknown>;

// 定義購物車項目的資料結構
export interface CartItem {
  internalId: string; // 前端識別ID (本地端為 UUID，伺服器端為資料庫 ID)
  productId: string;
  productName: string; 
  unitPrice: number;   
  
  serviceType: string;
  widthMatrix: { top: number; mid: number; bot: number };
  
  // ✅ 修正：使用 JsonObject 替代 any
  heightData: JsonObject;
  isCeilingMounted: boolean;
  siteConditions?: JsonObject;
  
  colorName: string;
  materialName: string;
  handleName: string;
  openingDirection: string;
  hasThreshold: boolean;
  
  quantity: number;
  subtotal: number;
  priceSnapshot: JsonObject; 
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 1. 初始化：檢查登入狀態並載入對應的購物車
  useEffect(() => {
    const checkAuth = () => {
      // 同時檢查 LocalStorage 與 SessionStorage
      const token = localStorage.getItem('somalink_token') || sessionStorage.getItem('somalink_token');
      const hasAuth = !!token;
      setIsLoggedIn(hasAuth);
      return hasAuth;
    };

    const authenticated = checkAuth();

    if (authenticated) {
      // A. 已登入：從伺服器抓取 (Server-side Cart)
      fetchServerCart();
    } else {
      // B. 未登入：從 LocalStorage 抓取 (Client-side Cart)
      const saved = localStorage.getItem('soma_cart');
      if (saved) {
        try {
          setItems(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse local cart', e);
        }
      }
    }
  }, []);

  // 僅在「未登入」時，將 items 變化同步回 LocalStorage
  // (已登入時，資料是直接寫入後端 DB，不需要存 LocalStorage)
  useEffect(() => {
    if (!isLoggedIn) {
      localStorage.setItem('soma_cart', JSON.stringify(items));
    }
  }, [items, isLoggedIn]);

  // --- 核心功能：從後端同步購物車 ---
  const fetchServerCart = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const serverItems: any[] = await api.cart.list();
      
      // 將後端資料格式轉換為前端 CartItem 格式
      // 注意：後端回傳的結構可能與前端不完全一樣，這裡要做 Mapping
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedItems: CartItem[] = serverItems.map((item: any) => ({
        internalId: item.id, // 使用後端資料庫 ID
        productId: item.product?.id,
        productName: item.product?.name || '未知商品',
        
        // 若後端沒存單價，可用總價反推或依賴快照
        unitPrice: Number(item.subtotal) / item.quantity, 
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
        
        // 規格還原
        serviceType: item.serviceType,
        widthMatrix: item.widthMatrix,
        heightData: item.heightData,
        isCeilingMounted: item.isCeilingMounted,
        siteConditions: item.siteConditions,
        colorName: item.colorName,
        materialName: item.materialName,
        handleName: item.handleName,
        openingDirection: item.openingDirection,
        hasThreshold: item.hasThreshold,
        priceSnapshot: item.priceSnapshot
      }));
      setItems(formattedItems);
    } catch (error) {
      console.error('無法同步伺服器購物車', error);
      // 如果 Token 過期導致失敗，可以選擇不處理，或者清空購物車
    }
  };

  // --- 動作：加入購物車 ---
  const addToCart = async (newItem: CartItem) => {
    if (isLoggedIn) {
      // A. 已登入：呼叫 API 寫入資料庫
      try {
        await api.cart.add({
          // 傳送符合後端 DTO 的資料
          productId: newItem.productId,
          quantity: newItem.quantity,
          subtotal: newItem.subtotal,
          serviceType: newItem.serviceType,
          widthMatrix: newItem.widthMatrix,
          heightData: newItem.heightData,
          isCeilingMounted: newItem.isCeilingMounted,
          siteConditions: newItem.siteConditions,
          colorName: newItem.colorName,
          materialName: newItem.materialName,
          handleName: newItem.handleName,
          openingDirection: newItem.openingDirection,
          hasThreshold: newItem.hasThreshold,
          priceSnapshot: newItem.priceSnapshot
        });
        // 加入後重新抓取，確保資料與後端一致
        await fetchServerCart();
      } catch (err) {
        console.error(err);
        alert('加入購物車失敗 (伺服器錯誤)，請稍後再試');
      }
    } else {
      // B. 未登入：操作本地狀態
      setItems((prev) => [...prev, newItem]);
    }
  };

  // --- 動作：移除項目 ---
  const removeFromCart = async (internalId: string) => {
    if (isLoggedIn) {
      // A. 已登入：呼叫 API 刪除
      try {
        await api.cart.remove(internalId);
        // 樂觀更新 (Optimistic Update)：先從 UI 移除，體驗比較快
        setItems((prev) => prev.filter((item) => item.internalId !== internalId));
      } catch (err) {
        console.error(err);
        alert('移除失敗');
        fetchServerCart(); // 失敗時回復狀態
      }
    } else {
      // B. 未登入：操作本地狀態
      setItems((prev) => prev.filter((item) => item.internalId !== internalId));
    }
  };

  // --- 動作：清空購物車 ---
  const clearCart = async () => {
    if (isLoggedIn) {
      // A. 已登入：呼叫 API 清空
      try {
        await api.cart.clear();
        setItems([]);
      } catch (err) { 
        console.error(err);
      }
    } else {
      // B. 未登入：清空 LocalStorage
      setItems([]);
      localStorage.removeItem('soma_cart');
    }
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
// 定義通用的資料格式，用來替換 any

export interface Product {
  id: string | number;
  name: string;
  price: number;
  description?: string;
  images: string[];
  series?: string;
  category?: string;
}

export interface CartItem extends Product {
  quantity: number;
  width?: number; // 淋浴拉門寬度
  height?: number; // 淋浴拉門高度
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  phone?: string;
  address?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'completed';
  createdAt: string;
}

// 通用 API 回傳格式
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
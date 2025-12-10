import axios from 'axios';

// 優先讀取環境變數，否則使用預設值
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://somalink-backend.onrender.com';

// 定義通用物件型別
type JsonObject = Record<string, unknown>;

// 定義單一品項的介面
export interface OrderItem {
  id: string;
  product: { 
    id?: string; 
    name: string;
    images?: string[];
    imageUrl?: string; 
  };
  serviceType: 'material' | 'assembled';
  widthMatrix: { top: number; mid: number; bot: number };
  heightData: JsonObject;
  isCeilingMounted: boolean;
  siteConditions?: JsonObject;
  colorName: string;
  materialName: string;
  handleName?: string;
  openingDirection: string;
  hasThreshold: boolean;
  quantity: number;
  subtotal: number;
  priceSnapshot: JsonObject;
}

// ✅ 修正：將 CartItem 設為 any，以相容 Context 中可能不同的資料結構
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CartItem = any;

export enum OrderStatus {
  PENDING = 'pending',       
  PROCESSING = 'processing', 
  SHIPPED = 'shipped',       
  COMPLETED = 'completed',   
  CANCELLED = 'cancelled',   
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  projectName: string;
  shippingAddress?: string;
  siteContactPerson?: string;
  siteContactPhone?: string;
  attachments?: string[];
  customerNote?: string;
  adminNote?: string;
  items: OrderItem[]; 
}

// 建立 Axios 實例
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('somalink_token') || sessionStorage.getItem('somalink_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 通用 API 回傳格式
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// ✅ 修正：加上 eslint-disable 來允許這裡使用 any 預設值
export const api = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: async <T = any>(url: string): Promise<T> => {
    const response = await axiosInstance.get(url);
    return response.data;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: async <T = any>(url: string, data: unknown): Promise<T> => {
    const response = await axiosInstance.post(url, data);
    return response.data;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch: async <T = any>(url: string, data: unknown): Promise<T> => {
    const response = await axiosInstance.patch(url, data);
    return response.data;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete: async <T = any>(url: string): Promise<T> => {
    const response = await axiosInstance.delete(url);
    return response.data;
  },
  
  auth: {
    forgotPassword: async (email: string) => {
      const response = await axiosInstance.post('/auth/forgot-password', { email });
      return response.data;
    },
    resetPassword: async (token: string, password: string) => {
      const response = await axiosInstance.post('/auth/reset-password', { token, password });
      return response.data;
    },
  },

  cart: {
    list: async () => {
      const response = await axiosInstance.get('/cart');
      return response.data;
    },
    add: async (item: unknown) => {
      const response = await axiosInstance.post('/cart', item);
      return response.data;
    },
    remove: async (id: string) => {
      const response = await axiosInstance.delete(`/cart/${id}`);
      return response.data;
    },
    clear: async () => {
      const response = await axiosInstance.delete('/cart');
      return response.data;
    }
  }
};
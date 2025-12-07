import axios from 'axios';

// 優先讀取環境變數，否則使用預設值 (Render Backend)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://somalink-backend.onrender.com';

// 定義單一品項的介面
export interface OrderItem {
  id: string;
  product: { 
    name: string;
    images?: string[];
    imageUrl?: string; 
  };
  serviceType: 'material' | 'assembled';
  widthMatrix: { top: number; mid: number; bot: number };
  heightData: any;
  isCeilingMounted: boolean;
  siteConditions?: any;
  colorName: string;
  materialName: string;
  // ✨✨✨ 新增把手欄位 ✨✨✨
  handleName?: string;
  openingDirection: string;
  hasThreshold: boolean;
  quantity: number;
  subtotal: number;
  priceSnapshot: any;
}

// 定義訂單狀態 Enum
export enum OrderStatus {
  PENDING = 'pending',       
  PROCESSING = 'processing', 
  SHIPPED = 'shipped',       
  COMPLETED = 'completed',   
  CANCELLED = 'cancelled',   
}

// 定義完整訂單介面
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  projectName: string;
  
  // 收貨與聯絡資訊
  shippingAddress?: string;
  siteContactPerson?: string;
  siteContactPhone?: string;
  
  // 附件
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

// 請求攔截器：自動帶入 Token
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // 前台使用的是 'somalink_token'
    // 同時檢查 LocalStorage 和 SessionStorage (記住我功能)
    const token = localStorage.getItem('somalink_token') || sessionStorage.getItem('somalink_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const api = {
  get: async (url: string) => {
    const response = await axiosInstance.get(url);
    return response.data;
  },
  post: async (url: string, data: any) => {
    const response = await axiosInstance.post(url, data);
    return response.data;
  },
  patch: async (url: string, data: any) => {
    const response = await axiosInstance.patch(url, data);
    return response.data;
  },
  delete: async (url: string) => {
    const response = await axiosInstance.delete(url);
    return response.data;
  },
  
  // ✨✨✨ 新增：認證相關 API (忘記密碼/重設密碼) ✨✨✨
  auth: {
    // 申請重設
    forgotPassword: async (email: string) => {
      const response = await axiosInstance.post('/auth/forgot-password', { email });
      return response.data;
    },
    // 執行重設
    resetPassword: async (token: string, password: string) => {
      const response = await axiosInstance.post('/auth/reset-password', { token, password });
      return response.data;
    },
  },

  // ✨✨✨ 新增：購物車專用 API ✨✨✨
  cart: {
    // 取得購物車
    list: async () => {
      const response = await axiosInstance.get('/cart');
      return response.data;
    },
    // 加入購物車
    add: async (item: any) => {
      const response = await axiosInstance.post('/cart', item);
      return response.data;
    },
    // 移除單項
    remove: async (id: string) => {
      const response = await axiosInstance.delete(`/cart/${id}`);
      return response.data;
    },
    // 清空購物車
    clear: async () => {
      const response = await axiosInstance.delete('/cart');
      return response.data;
    }
  }
};
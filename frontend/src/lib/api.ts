import axios from 'axios';

// 優先讀取環境變數，否則使用預設值 (Render Backend)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://somalink-backend.onrender.com';

// 定義單一品項的介面
export interface OrderItem {
  id: string;
  product: { 
    name: string;
    imageUrl?: string; // 預留圖片欄位
  };
  serviceType: 'material' | 'assembled'; // ✨ 服務模式：純材料 vs 連工帶料
  widthMatrix: { top: number; mid: number; bot: number };
  heightData: any; // 可以進一步定義細節
  isCeilingMounted: boolean;
  siteConditions?: any;
  colorName: string;
  materialName: string;
  openingDirection: string;
  hasThreshold: boolean;
  quantity: number;
  subtotal: number;
  priceSnapshot: any;
}

// 定義訂單狀態 Enum
export enum OrderStatus {
  PENDING = 'pending',       // 待審核
  PROCESSING = 'processing', // 生產中
  SHIPPED = 'shipped',       // 已出貨 (新增)
  COMPLETED = 'completed',   // 已完成
  CANCELLED = 'cancelled',   // 已取消
}

// 定義完整訂單介面
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus; // 使用 Enum
  totalAmount: number;
  createdAt: string;
  projectName: string;
  
  // ✨ 新增：客戶備註與管理員備註
  customerNote?: string;
  adminNote?: string;

  // 關聯資訊
  items: OrderItem[]; // ✨ 這裡改成陣列
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
    // 前台通常存成 'token'
    const token = localStorage.getItem('token'); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 封裝 API 方法，自動回傳 response.data，簡化調用
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
};
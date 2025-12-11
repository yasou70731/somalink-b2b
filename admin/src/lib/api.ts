import axios from 'axios';

// ✨ 設定：優先使用環境變數，若無則使用您的線上後端
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://somalink-backend.onrender.com';

// --- TypeScript 介面定義區 ---

export interface OrderItem {
  id: string;
  product: { 
    name: string; 
    images?: string[]; 
    imageUrl?: string; 
  };
  serviceType: string;
  widthMatrix: { top: number; mid: number; bot: number };
  heightData: any;
  isCeilingMounted: boolean;
  siteConditions?: any;
  colorName: string;
  materialName: string;
  handleName?: string;
  openingDirection: string;
  hasThreshold: boolean;
  quantity: number;
  subtotal: number;
  priceSnapshot?: any;
}

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
  status: OrderStatus | string;
  totalAmount: number;
  createdAt: string;
  projectName: string;
  shippingAddress?: string;
  siteContactPerson?: string;
  siteContactPhone?: string;
  attachments?: string[];
  user: {
    id: string;
    email: string;
    name: string;
    dealerProfile?: {
      companyName: string;
      contactPerson: string;
      phone: string;
      address: string;
    };
  };
  items: OrderItem[]; 
  adminNote?: string;
  customerNote?: string;
}

// --- Axios 實例設定 ---

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // 【偵錯區塊 Start】
    const token = localStorage.getItem('admin_token');
    
    // 請在 F12 Console 觀察這幾行字
    console.log('🔍 [API Debug] 正在準備發送請求:', config.url);
    console.log('🔍 [API Debug] 嘗試讀取 admin_token:', token ? '有抓到 Token (前10碼): ' + token.substring(0, 10) : '❌ 未抓到 Token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ [API Warning] 請求未包含 Token，可能會導致 401 錯誤');
    }
    // 【偵錯區塊 End】
  }
  return config;
});

// --- API 方法導出 ---

export const api = {
  get: async (url: string) => {
    try {
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('❌ [API Error] GET 請求失敗:', url, error);
      throw error;
    }
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
  
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'yasou70731'); 
    
    const res = await axios.post(
      'https://api.cloudinary.com/v1_1/dnibj8za6/image/upload', 
      formData
    );
    return res.data.secure_url;
  }
};
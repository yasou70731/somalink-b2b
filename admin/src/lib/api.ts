import axios from 'axios';

// ✨ 設定：優先使用環境變數，若無則使用您的線上後端 (根據之前的錯誤訊息)
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
  
  // ✨✨✨ 補上這些缺少的欄位 ✨✨✨
  handleName?: string; // 把手
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
  
  // ✨✨✨ 補上收貨與附件欄位 ✨✨✨
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
    // 【關鍵修正】這裡原本寫 'somalink_admin_token'，導致抓不到您存的 'admin_token'
    const token = localStorage.getItem('admin_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// --- API 方法導出 ---

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
  
  // 圖片上傳
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    // 建議將此字串移至 .env，目前先保留寫死以利測試
    formData.append('upload_preset', 'yasou70731'); 
    
    const res = await axios.post(
      'https://api.cloudinary.com/v1_1/dnibj8za6/image/upload', 
      formData
    );
    return res.data.secure_url;
  }
};
import axios from 'axios';

// 優先讀取環境變數，否則使用預設值
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://somalink-backend.onrender.com';

// 定義單一品項的介面
export interface OrderItem {
  id: string;
  product: { 
    name: string;
    imageUrl?: string;
  };
  serviceType: string;
  widthMatrix: { top: number; mid: number; bot: number };
  heightData: any;
  isCeilingMounted: boolean;
  siteConditions?: any;
  colorName: string;
  materialName: string;
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

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✨ Fix: 修正 Token 讀取名稱，必須與登入頁一致 ('somalink_admin_token')
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // 🔴 修正點在此：
    const token = localStorage.getItem('somalink_admin_token');
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
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'somalink_preset');
    
    const res = await axios.post(
      'https://api.cloudinary.com/v1_1/dnibj8za6/image/upload', 
      formData
    );
    return res.data.secure_url;
  }
};
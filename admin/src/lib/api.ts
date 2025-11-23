import axios from 'axios';

// 優先讀取環境變數，否則使用預設值 (Render Backend)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://somalink-backend.onrender.com';

// 定義單一品項的介面
export interface OrderItem {
  id: string;
  product: { 
    name: string;
    imageUrl?: string;
  };
  serviceType: string; // 後台可以寬鬆一點用 string，或是同步用 'material' | 'assembled'
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

// 定義訂單狀態 Enum (與前端同步)
export enum OrderStatus {
  PENDING = 'pending',       // 待審核
  PROCESSING = 'processing', // 生產中
  SHIPPED = 'shipped',       // 已出貨 (新增)
  COMPLETED = 'completed',   // 已完成
  CANCELLED = 'cancelled',   // 已取消
}

// 定義訂單介面
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus | string; // 兼容 string 以防後端回傳格式差異
  totalAmount: number;
  createdAt: string;
  projectName: string;
  
  // 使用者資訊 (後台需要顯示這些)
  user: {
    id: string;
    email: string;
    name: string; // 可能是 nickname 或 dealerProfile 的名稱
    dealerProfile?: {
      companyName: string;
      contactPerson: string;
      phone: string;
      address: string;
    };
  };

  // ✨ 這裡必須是 items 陣列
  items: OrderItem[]; 
  
  // 備註欄位 (選填)
  adminNote?: string;
  customerNote?: string;
}

// 建立 Axios 實例
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 後台通常存成 'admin_token'，這裡要注意與前台的區別
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 封裝 API 方法
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
  // 圖片上傳功能 (後台專用)
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'somalink_preset'); // 請確認您的 Cloudinary Preset 名稱
    
    // 直接上傳到 Cloudinary (不經過您的後端以節省流量)
    const res = await axios.post(
      'https://api.cloudinary.com/v1_1/dnibj8za6/image/upload', 
      formData
    );
    return res.data.secure_url;
  }
};
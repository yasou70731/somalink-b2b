import axios from 'axios';

// ✨ 設定 1：強制指向本機後端，解決連線到雲端舊資料的問題
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
  
  // ✨ 補上附件欄位定義
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

// ✨ 設定 2：請求攔截器 (修正 Token 讀取位置)
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // ⚠️ 關鍵修正：後台必須讀取 'somalink_admin_token'
    // 如果讀成前台的 'somalink_token' 就會導致 401 錯誤
    const token = localStorage.getItem('somalink_admin_token');
    
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
  
  // 圖片上傳 (Cloudinary)
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
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
    // 【萬能搜尋 Token】
    // 同時檢查 'admin_token' 和 'somalink_admin_token'
    // 這樣不管登入頁面存成什麼名字，只要有存，我們就抓得到
    const token = localStorage.getItem('admin_token') || localStorage.getItem('somalink_admin_token');
    
    // 偵錯日誌：顯示我們最後抓到了什麼
    console.log('🔍 [API Debug] 請求路徑:', config.url);
    if (token) {
       console.log('✅ [API Debug] 成功抓取 Token (前10碼):', token.substring(0, 10));
       config.headers.Authorization = `Bearer ${token}`;
    } else {
       console.error('❌ [API Error] 嚴重錯誤：LocalStorage 內找不到 admin_token 或 somalink_admin_token');
       console.log('💡 [提示] 請嘗試登出後台並重新登入，以確保 Token 被寫入');
    }
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
      // 這裡不 throw error，避免讓整個頁面崩潰，可以回傳 null 或空陣列讓前端處理
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
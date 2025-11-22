import axios from 'axios';

// ✨ 修改這裡：優先讀取環境變數，如果沒有才用 localhost
// 這樣上線後，我們只要在 Vercel 設定變數，它就會自動切換
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器 (Token)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('somalink_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 回應攔截器 (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('somalink_token');
        // 可以在這裡強制轉導，或讓頁面自己處理
      }
    }
    return Promise.reject(error);
  }
);
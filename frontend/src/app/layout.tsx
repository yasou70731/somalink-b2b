import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import { CartProvider } from '@/context/CartContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '松成有限公司 B2B 數位工廠',
  description: '經銷商專屬客製化門扇與建材採購平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      {/* 使用 Inter 字體 */}
      <body className={inter.className}>
        {/* 購物車狀態提供者，包裹整個應用程式 */}
        <CartProvider>
          {/* 導覽列，顯示在所有頁面頂部 */}
          <Navbar />
          
          {/* 頁面內容 (例如 /page.tsx, /product/[id]/page.tsx) */}
          <main>
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  )
}
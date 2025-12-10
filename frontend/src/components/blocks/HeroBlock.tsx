'use client';
import { useState, useEffect, useMemo } from 'react'; // ✨ 1. 補上 useMemo
import Link from "next/link";
import Image from 'next/image';
import { ArrowRight } from "lucide-react";

// ✨ 2. 定義資料介面，解決 'any' 報錯
interface HeroData {
  images?: string[];
  title?: string;
  subtitle?: string;
}

export default function HeroBlock({ data }: { data: HeroData }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ✨ 3. 使用 useMemo 確保陣列參考穩定，消除依賴警告
  const images = useMemo(() => data.images || [], [data.images]);

  useEffect(() => {
    // 如果圖片少於 2 張，就不需要輪播
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [images]); // 現在 images 是穩定的，這裡就不會報錯了

  return (
    <div className="relative h-[85vh] w-full overflow-hidden bg-gray-900">
      {images.map((src: string, index: number) => (
        <div 
          key={index} 
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
        >
          <Image
            src={src} 
            alt="Hero"
            fill 
            className="object-cover" 
            priority={index === 0} 
            sizes="100vw" 
          />
        </div>
      ))}
      
      {/* 黑色遮罩 */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* 文字內容 */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-6 flex flex-col justify-center items-start text-white">
        <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold mb-6">SOMA 松成有限公司</span>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 whitespace-pre-wrap">{data.title}</h1>
        <p className="text-lg md:text-xl text-gray-100 max-w-xl mb-10">{data.subtitle}</p>
        <div className="flex gap-4">
          <Link href="/portal" className="px-8 py-4 bg-white text-gray-900 rounded-full font-bold hover:bg-gray-100 flex items-center gap-2">進入經銷系統 <ArrowRight className="w-5 h-5" /></Link>
        </div>
      </div>
    </div>
  );
}
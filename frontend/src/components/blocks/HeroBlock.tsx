'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from "next/link";
import Image from 'next/image';
import { ArrowRight } from "lucide-react";

interface HeroData {
  images?: string[];
  title?: string;
  subtitle?: string;
}

// 這些是備用的有效圖片
const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1620626012053-93f2bc72338d?auto=format&fit=crop&q=80&w=1920", // 辦公室/門扇
  "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&q=80&w=1920", // 室內設計
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920"  // 現代建築
];

// ❌ 已知失效的圖片 ID 列表 (黑名單)
const BROKEN_IMAGES = [
  "photo-1584622050111-993a426fbf0a", // 導致 404 的這張
];

export default function HeroBlock({ data }: { data: HeroData }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = useMemo(() => {
    // 1. 取得 API 資料或空陣列
    const apiImages = data.images || [];

    // 2. 過濾掉已知的失效圖片連結
    const validApiImages = apiImages.filter(url => {
      if (!url) return false;
      // 如果網址包含失效的 ID，就過濾掉
      return !BROKEN_IMAGES.some(brokenId => url.includes(brokenId));
    });

    // 3. 如果過濾後還有圖片，就使用 API 的；否則使用預設圖
    return validApiImages.length > 0 ? validApiImages : DEFAULT_IMAGES;
  }, [data.images]); 

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [images]);

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
      
      <div className="absolute inset-0 bg-black/40" />
      
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
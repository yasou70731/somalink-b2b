'use client';
import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from 'next/image'; // ✨ 1. 引入 Next.js Image 元件
import { ArrowRight } from "lucide-react";

export default function HeroBlock({ data }: { data: any }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = data.images || [];

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
        // ✨ 2. 使用 div 包裹 Image 處理淡入淡出 (transition-opacity)
        <div 
          key={index} 
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* ✨ 3. 使用 <Image /> 取代 <img> */}
          <Image
            src={src} 
            alt="Hero"
            fill // 自動填滿父層 div
            className="object-cover" // 保持比例裁切
            priority={index === 0} // 第一張圖優先載入 (提升效能分數)
            sizes="100vw" // 告訴瀏覽器這張圖佔滿視窗寬度
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
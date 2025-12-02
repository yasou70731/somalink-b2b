'use client';
import { useState, useEffect } from 'react';
import Link from "next/link";
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
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          key={index} src={src} alt="Hero"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
        />
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
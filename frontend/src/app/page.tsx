'use client';

import { useState, useEffect } from 'react';
import { Megaphone, X, Loader2 } from "lucide-react";
import { api } from '@/lib/api';
import HeroBlock from '@/components/blocks/HeroBlock';
import FeaturesBlock from '@/components/blocks/FeaturesBlock';
import ProductListBlock from '@/components/blocks/ProductListBlock';

export default function HomePage() {
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✨ 系統規則 (含公司資訊)
  const [systemRules, setSystemRules] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const annRes = await api.get('/announcements/active');
        if (annRes?.content) setAnnouncement(annRes.content);

        const configRes = await api.get('/site-config/homepage');
        if (configRes?.blocks) setBlocks(configRes.blocks);

        // ✨ 抓取系統規則 (公司資訊)
        const rulesRes = await api.get('/site-config/rules');
        if (rulesRes?.settings) setSystemRules(rulesRes.settings);

      } catch (err) {
        console.error('無法取得首頁資料', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><div className="flex flex-col items-center gap-3"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /><p className="text-gray-500 text-sm">載入首頁中...</p></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {announcement && showBanner && (
        <div className="bg-blue-600 text-white px-4 py-2.5 relative flex justify-center items-center text-sm z-50 animate-in slide-in-from-top">
          <div className="flex items-center gap-2"><Megaphone className="w-4 h-4 animate-pulse" /><span>{announcement}</span></div>
          <button onClick={() => setShowBanner(false)} className="absolute right-2 p-1 hover:bg-blue-700 rounded-full transition-colors"><X className="w-4 h-4" /></button>
        </div>
      )}

      {blocks.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <p>首頁目前沒有內容，請至後台 [系統設定] &rarr; [首頁版面配置] 新增積木。</p>
        </div>
      ) : (
        blocks.map((block) => {
          switch (block.type) {
            case 'HERO': return <HeroBlock key={block.id} data={block.data} />;
            case 'FEATURES': return <FeaturesBlock key={block.id} data={block.data} />;
            case 'PRODUCT_LIST': return <ProductListBlock key={block.id} data={block.data} />;
            default: return null;
          }
        })
      )}

      {/* ✨✨✨ 動態 Footer ✨✨✨ */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">S</div>
            <div>
              <span className="text-xl font-bold block">{systemRules?.company_name || '松成有限公司'}</span>
              <span className="text-xs text-gray-400">統一編號：{systemRules?.tax_id || '12345678'}</span>
            </div>
          </div>
          <div className="text-center md:text-right text-sm text-gray-400">
            <p>地址：{systemRules?.address || '新北市三重區...'}</p>
            <p className="mt-1">電話：{systemRules?.phone || '(02) 2345-6789'}</p>
            <p className="mt-4 text-xs text-gray-600">{systemRules?.copyright_text || '© 2025 SomaLink. All rights reserved.'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
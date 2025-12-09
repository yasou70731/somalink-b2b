/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 忽略 ESLint 錯誤
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 忽略 TypeScript 類型錯誤
    ignoreBuildErrors: true,
  },
  images: {
    // 在這裡加入允許的外部圖片網域
    // 根據你的報錯，通常是 Unsplash 的圖片
    domains: [
      'images.unsplash.com', 
      'plus.unsplash.com',
      'source.unsplash.com'
    ],
  },
};

export default nextConfig;
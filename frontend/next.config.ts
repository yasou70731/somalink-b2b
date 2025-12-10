/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允許的圖片來源網域設定
  // 這解決了 "Failed to load resource" 和 "hostname is not configured" 的問題
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
    ],
  },
  // 你的程式碼已經通過 Lint 檢查，所以不需要再加入 ignoreBuildErrors 或 ignoreDuringBuilds
};

export default nextConfig;
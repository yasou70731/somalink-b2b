/** @type {import('next').NextConfig} */
const nextConfig = {
  // 我們移除了 eslint 和 typescript 的 ignore 設定
  // 這樣打包時才會真的檢查程式碼品質與型別安全

  images: {
    // 保留你的外部圖片來源設定，這對應你的圖片功能
    domains: [
      'images.unsplash.com',
      'plus.unsplash.com', 
      'source.unsplash.com'
    ],
  },
};

export default nextConfig;
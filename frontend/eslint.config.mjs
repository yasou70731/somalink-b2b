import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 1. 設定全域忽略清單 (Ignores)
  {
    ignores: [
      ".next/**",        // 忽略 Next.js 打包產物
      "node_modules/**", // 忽略依賴
      "dist/**",
      "build/**",
      "**/next-env.d.ts", // ✅ 修正路徑匹配，解決 triple-slash 報錯
      "**/*.d.ts"
    ],
  },

  // 2. 繼承 Next.js 的標準規則
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // 3. 關閉部分過於嚴格的規則 (針對你的專案狀況)
  {
    rules: {
      // 允許使用 img 標籤 (如果你暫時不想全改用 Next Image)
      "@next/next/no-img-element": "off",
      // 允許 catch (error: any) 的寫法，減少修改量
      "@typescript-eslint/no-explicit-any": "warn", 
      // 允許定義了但沒用到的變數 (改成警告就好，不擋 Build)
      "@typescript-eslint/no-unused-vars": "warn"
    },
  },
];

export default eslintConfig;
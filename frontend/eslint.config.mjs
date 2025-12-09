import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 1. 繼承 Next.js 預設規則
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // 2. ✨✨✨ 新增：自定義規則 (關閉嚴格檢查) ✨✨✨
  {
    rules: {
      // 允許使用 any 型別
      "@typescript-eslint/no-explicit-any": "off",
      // 允許宣告未使用的變數 (如 catch(e) 的 e)
      "@typescript-eslint/no-unused-vars": "off",
      // (選用) 關閉 React Hook 依賴檢查警告，避免 yellow lines
      "react-hooks/exhaustive-deps": "off" 
    },
  },
];

export default eslintConfig;
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 使用 compat.extends 載入 Next.js 的預設規則
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
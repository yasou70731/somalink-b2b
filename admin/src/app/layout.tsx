import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";

export const metadata: Metadata = {
  title: "SomaLink Admin",
  description: "B2B 工廠管理後台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="bg-gray-100">
        <LayoutShell>
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}
import "./globals.css";
import "./fonts.css";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Time Glass",
    default: "Time Glass - 员工生产力分析平台",
  },
  description: "全面监控、深入分析、优化员工工作效率，提升企业整体生产力",
  keywords: ["生产力分析", "员工监控", "效率优化", "时间管理", "企业管理"],
  authors: [{ name: "Time Glass Team" }],
  creator: "Time Glass",
  publisher: "Time Glass",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="scroll-smooth" suppressHydrationWarning>
      <head />
      <body className="font-sans min-h-screen flex flex-col antialiased">
        <ThemeProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

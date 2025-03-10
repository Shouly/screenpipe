import { Noto_Sans_SC, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });
const notoSansSC = Noto_Sans_SC({ 
  weight: ['300', '400', '500', '700', '900'],
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-noto-sans-sc',
});

export const metadata: Metadata = {
  title: "Time Glass - 时间管理应用",
  description: "一个帮助您管理时间的应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`scroll-smooth ${notoSansSC.variable}`}>
      <body className={`${inter.className} ${notoSansSC.className} min-h-screen flex flex-col`}>
        <ThemeProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

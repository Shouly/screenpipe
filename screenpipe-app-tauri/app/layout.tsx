"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

// Debounced localStorage writer
const createDebouncer = (wait: number) => {
  let timeout: NodeJS.Timeout;
  return (fn: Function) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(), wait);
  };
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    // 检查本地存储中的主题设置
    const savedTheme = localStorage.getItem("theme");
    // 检查系统主题偏好
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    
    // 使用保存的主题或系统主题
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme as "light" | "dark");
    
    // 应用主题
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const logs: string[] = [];
      const MAX_LOGS = 1000;
      const originalConsole = { ...console };
      const debouncedWrite = createDebouncer(1000);

      ["log", "error", "warn", "info"].forEach((level) => {
        (console[level as keyof Console] as any) = (...args: any[]) => {
          // Call original first for performance
          (originalConsole[level as keyof Console] as Function)(...args);

          // Add to memory buffer
          logs.push(
            `[${level.toUpperCase()}] ${args
              .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
              .join(" ")}`
          );

          // Trim buffer if needed
          if (logs.length > MAX_LOGS) {
            logs.splice(0, logs.length - MAX_LOGS);
          }

          // Debounced write to localStorage
          debouncedWrite(() => {
            try {
              localStorage.setItem("console_logs", logs.join("\n"));
            } catch (e) {
              // If localStorage is full, clear half the logs
              logs.splice(0, logs.length / 2);
              localStorage.setItem("console_logs", logs.join("\n"));
            }
          });
        };
      });
    }
  }, []);

  // 如果主题还未确定，返回一个空的div以避免闪烁
  if (theme === null) {
    return null;
  }

  return (
    <html lang="en" suppressHydrationWarning className={theme}>
      <Providers>
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </Providers>
    </html>
  );
}

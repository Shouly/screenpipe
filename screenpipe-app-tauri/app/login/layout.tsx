"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/hooks/use-settings";
import { useRouter } from "next/navigation";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useSettings();
  const router = useRouter();

  // 如果用户已登录，重定向到主页
  useEffect(() => {
    if (settings.user?.token) {
      router.push("/");
    }
  }, [settings.user?.token, router]);

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#1c1c1c] overflow-hidden">
      {children}
    </div>
  );
} 
"use client";

import { useAuth } from "@/lib/auth";
import { Header } from "./header";
import { Footer } from "./footer";
import { AdminLayout } from "./admin-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  // 登录后使用管理后台布局
  if (isAuthenticated) {
    return (
      <ProtectedRoute>
        <AdminLayout>{children}</AdminLayout>
      </ProtectedRoute>
    );
  }

  // 未登录时使用公开布局
  return (
    <>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
} 
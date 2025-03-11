"use client";

import { useAuth } from "@/lib/auth";
import { usePathname } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  
  // 公开页面列表
  const publicPages = ["/", "/login", "/register", "/about"];
  const isPublicPage = publicPages.some(page => 
    pathname === page || pathname.startsWith(`${page}/`)
  );
  
  // 如果是公开页面，直接显示内容
  if (isPublicPage) {
    return <>{children}</>;
  }
  
  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  // 如果已登录，显示内容
  if (isAuthenticated) {
    return <>{children}</>;
  }
  
  // 如果未登录且不是公开页面，不显示内容（重定向由AuthProvider处理）
  return null;
} 
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // 检查用户是否已登录
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 在实际应用中，这里应该调用API检查用户的登录状态
        // 这里我们使用localStorage模拟
        const storedUser = localStorage.getItem("user");
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 登录函数
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // 在实际应用中，这里应该调用API进行登录验证
      // 这里我们使用模拟数据
      const mockUser: User = {
        id: "1",
        name: "测试用户",
        email: email,
        role: "admin",
      };
      
      // 存储用户信息
      localStorage.setItem("user", JSON.stringify(mockUser));
      setUser(mockUser);
      
      // 登录成功后重定向到仪表盘
      router.push("/productivity");
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 登出函数
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
  };

  // 公开页面列表
  const publicPages = ["/", "/login", "/register", "/about"];
  
  // 检查是否需要重定向
  useEffect(() => {
    if (!isLoading) {
      const isPublicPage = publicPages.some(page => 
        pathname === page || pathname.startsWith(`${page}/`)
      );
      
      if (!user && !isPublicPage) {
        // 如果用户未登录且不是公开页面，重定向到登录页
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }
  }, [user, isLoading, pathname, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 
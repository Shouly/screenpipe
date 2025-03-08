"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/hooks/use-settings";
import { useToast } from "@/components/ui/use-toast";
import { UserApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function VerifyLoginPage() {
  const { updateSettings } = useSettings();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const verifyLogin = async () => {
      const email = searchParams.get("email");
      const code = searchParams.get("code");
      
      if (!email || !code) {
        setError("无效的登录链接，缺少必要参数");
        setIsVerifying(false);
        return;
      }
      
      try {
        const userApi = new UserApi();
        const response = await userApi.verifyEmailLogin(email, code);
        
        // 更新设置中的用户数据和令牌
        updateSettings({ 
          user: response.user,
          authToken: response.access_token
        });
        
        toast({
          title: "登录成功",
          description: "欢迎回到ScreenPipe",
        });
        
        // 登录成功后跳转到主页
        router.push("/");
      } catch (error) {
        console.error("验证登录失败:", error);
        setError("登录链接已过期或无效，请重新登录");
        setIsVerifying(false);
      }
    };
    
    verifyLogin();
  }, [searchParams, updateSettings, toast, router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            验证登录
          </h1>
          
          {isVerifying ? (
            <div className="mt-6 flex flex-col items-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-zinc-600 dark:text-zinc-300">
                正在验证您的登录请求，请稍候...
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <p className="text-red-500 dark:text-red-400">
                {error}
              </p>
              <Button
                className="w-full"
                onClick={() => router.push("/login")}
              >
                返回登录页面
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
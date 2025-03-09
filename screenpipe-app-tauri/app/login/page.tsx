"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/lib/hooks/use-settings";
import { useToast } from "@/components/ui/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, ExternalLink, MonitorX, Loader2, Mail, CheckCircle } from "lucide-react";
import { UserApi } from "@/lib/api";
import { platform } from "@tauri-apps/plugin-os";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { updateSettings, saveSettings } = useSettings();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // 从URL参数中获取邮箱地址
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleLogin = async () => {
    if (!email) {
      toast({
        title: "邮箱必填",
        description: "请输入您的邮箱以继续",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // 获取设备信息
      const os = await platform();
      
      // 创建设备信息 - 适配新的用户模型
      const deviceInfo = {
        name: "我的Mac电脑",
        device_type: "desktop",
        os: os || "macOS",
        os_version: "14.0",
        browser: "Tauri App",
        browser_version: "1.0",
        ip_address: "127.0.0.1"
      };
      
      // 调用后端API发送登录链接
      const userApi = new UserApi();
      let response;
      try {
        // 使用邮箱登录方法
        response = await userApi.emailLogin(
          email,      // 使用邮箱
          deviceInfo  // 设备信息
        );
        
        // 显示登录链接已发送的提示
        toast({
          title: "验证码已发送",
          description: "请检查您的邮箱，输入6位验证码完成登录",
        });
        
        // 显示验证码输入表单
        setShowVerificationForm(true);
        
      } catch (apiError) {
        console.error("API调用失败:", apiError);
        throw apiError;
      }
    } catch (error) {
      console.error("登录失败:", error);
      
      // 提供更具体的错误信息
      let errorMessage = "发送登录链接失败";
      if (!navigator.onLine) {
        errorMessage = "网络连接失败，请检查您的网络连接";
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: "登录失败",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理验证码提交
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "验证码不能为空",
        description: "请输入您收到的验证码",
        variant: "destructive",
      });
      return;
    }
    
    setIsVerifying(true);
    
    try {
      console.log("开始验证登录验证码...");
      const userApi = new UserApi();
      const response = await userApi.verifyEmailLogin(email, verificationCode);
      
      console.log("验证成功，保存用户数据和令牌...", {
        userId: response.user.id,
        email: response.user.email,
        tokenLength: response.access_token.length
      });
      
      // 使用saveSettings代替updateSettings，确保设置被保存到本地存储
      await saveSettings({ 
        user: response.user,
        authToken: response.access_token
      });
      
      console.log("用户数据和令牌已保存");
      
      toast({
        title: "登录成功",
        description: "欢迎回到ScreenPipe",
      });
      
      // 使用setTimeout确保状态更新和toast显示后再跳转
      // 这样可以避免跳转延迟的感觉，因为用户已经看到了成功提示
      setTimeout(() => {
        console.log("准备跳转到主页...");
        router.push("/");
        // 强制刷新以确保路由更新
        router.refresh();
      }, 500); // 增加延迟时间，确保数据保存完成
    } catch (error) {
      console.error("验证登录失败:", error);
      toast({
        title: "验证失败",
        description: "验证码无效或已过期，请重新获取",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // 重新发送验证码
  const handleResendCode = async () => {
    setShowVerificationForm(false);
    // 重新调用登录流程
    await handleLogin();
  };

  const handleGoogleLogin = async () => {
    // 显示功能尚未完全实现的提示
    toast({
      title: "功能开发中",
      description: "Google登录功能尚未完全实现，请使用邮箱登录",
      variant: "default",
    });
    
    // 暂时不执行实际的登录逻辑
    return;
  };

  return (
    <div className="flex min-h-screen">
      {/* 左侧品牌和登录区域 */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-12">
        <div className="flex-1 flex flex-col justify-center max-w-md w-full">
          {/* 品牌标识 */}
          <div className="mb-8 md:mb-12 flex justify-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#e25822] to-[#f47b20] flex items-center justify-center">
                <MonitorX size={16} className="text-white" />
              </div>
              <span className="text-2xl font-medium text-zinc-900 dark:text-white">ScreenPipe</span>
            </div>
          </div>

          {/* 主标题和副标题 */}
          <div className="mb-8 md:mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-white mb-4 md:mb-6">
              您的想法，
              <span className="text-[#e25822] dark:text-[#f47b20]">放大</span>
            </h1>
            <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-300">
              隐私优先的AI，帮助您自信创造。
            </p>
          </div>

          {/* 登录表单 - 放在白色卡片内 */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6 mb-6">
            {!showVerificationForm ? (
              <div className="space-y-6">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2 h-12 border-zinc-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors rounded-md"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      处理中...
                    </div>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width="20" height="20" className="mr-2">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      使用Google继续
                    </>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="dark:bg-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500 dark:text-zinc-400">
                      或
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      id="email"
                      placeholder="输入您的个人或工作邮箱"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-[#e25822]/20 rounded-md"
                    />
                  </div>
                  <Button 
                    className="w-full h-12 bg-[#e25822] hover:bg-[#d24812] text-white transition-colors rounded-md font-medium" 
                    onClick={handleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        登录中...
                      </div>
                    ) : "使用邮箱继续"}
                  </Button>
                  
                  {/* 隐私条款 - 移到登录框内部并居中 */}
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-4 mt-2 text-center">
                    <p>
                      继续使用即表示您同意ScreenPipe的{" "}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-normal text-xs text-zinc-500 dark:text-zinc-400 hover:text-[#e25822] dark:hover:text-[#f47b20] underline underline-offset-2"
                        onClick={() => openUrl("https://screenpi.pe/terms")}
                      >
                        用户条款
                      </Button>{" "}
                      和{" "}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-normal text-xs text-zinc-500 dark:text-zinc-400 hover:text-[#e25822] dark:hover:text-[#f47b20] underline underline-offset-2"
                        onClick={() => openUrl("https://screenpi.pe/privacy")}
                      >
                        使用政策
                      </Button>，并确认您已阅读{" "}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-normal text-xs text-zinc-500 dark:text-zinc-400 hover:text-[#e25822] dark:hover:text-[#f47b20] underline underline-offset-2"
                        onClick={() => openUrl("https://screenpi.pe/privacy")}
                      >
                        隐私政策
                      </Button>。
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="mb-8 flex justify-center">
                  </div>
                  
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
                    输入验证码
                  </h2>
                  
                  <p className="text-zinc-600 dark:text-zinc-300 mb-6">
                    我们已向 <span className="font-medium text-[#e25822] dark:text-[#f47b20]">{email}</span> 发送了临时登录码
                  </p>
                </div>
                
                {/* 验证码输入区域 */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Input
                      id="verification-code"
                      type="text"
                      placeholder="输入登录码"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="h-12 text-center text-lg font-medium bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-[#e25822]/20 rounded-md"
                      disabled={isVerifying}
                      autoComplete="one-time-code"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleVerifyCode}
                    disabled={isVerifying || !verificationCode.trim()}
                    className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 dark:bg-[#e25822] dark:hover:bg-[#d24812] text-white transition-all duration-200 font-medium rounded-md"
                  >
                    {isVerifying ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        验证中...
                      </div>
                    ) : "继续"}
                  </Button>
                </div>
                
                <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                  <p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-normal text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#e25822] dark:hover:text-[#f47b20] underline underline-offset-2"
                      onClick={handleResendCode}
                      disabled={isLoading}
                    >
                      不是您？重新登录
                    </Button>
                  </p>
                </div>
                
                <div className="pt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  <p>
                    继续使用即表示您同意ScreenPipe的{" "}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-normal text-xs text-zinc-500 dark:text-zinc-400 hover:text-[#e25822] dark:hover:text-[#f47b20] underline underline-offset-2"
                      onClick={() => openUrl("https://screenpi.pe/terms")}
                    >
                      服务条款
                    </Button>{" "}
                    和{" "}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-normal text-xs text-zinc-500 dark:text-zinc-400 hover:text-[#e25822] dark:hover:text-[#f47b20] underline underline-offset-2"
                      onClick={() => openUrl("https://screenpi.pe/privacy")}
                    >
                      隐私政策
                    </Button>
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* 右侧功能介绍区域 - 新设计 */}
      <div className="hidden md:block w-1/2 p-8 md:p-12 flex items-center justify-center">
        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#e25822]/90 to-[#f47b20]/90 flex items-center justify-center overflow-hidden relative">
          {/* 背景图案 */}
          <div className="absolute inset-0 opacity-10 bg-[url('/images/grid-pattern.svg')] bg-repeat"></div>
          
          {/* 内容容器 */}
          <div className="relative z-10 max-w-lg p-8 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              隐私优先的AI助手
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">本地优先</h3>
                  <p className="text-white/80">您的数据保留在您的设备上，确保最大程度的隐私保护。</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">智能助手</h3>
                  <p className="text-white/80">AI助手帮助您分析屏幕内容，提供有价值的见解和建议。</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">深色模式</h3>
                  <p className="text-white/80">支持深色模式，保护您的眼睛，提供舒适的使用体验。</p>
                </div>
              </div>
            </div>
            
            <div className="mt-10 pt-6 border-t border-white/20">
              <p className="text-white/70 italic">
                "ScreenPipe帮助我更高效地工作，同时保护我的隐私。这是我用过的最好的屏幕助手工具。"
              </p>
              <p className="mt-2 font-medium">— 满意用户</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
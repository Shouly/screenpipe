"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/lib/hooks/use-settings";
import { useToast } from "@/components/ui/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, ExternalLink, MonitorX } from "lucide-react";
import { UserApi } from "@/lib/api";
import { platform } from "@tauri-apps/plugin-os";

export default function LoginPage() {
  const { updateSettings } = useSettings();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // 从URL参数中获取邮箱地址
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  // 检测系统主题
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

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    
    // 保存主题设置到localStorage
    localStorage.setItem("theme", newTheme);
  };

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
        
        // 跳转到等待页面
        router.push(`/login/waiting?email=${encodeURIComponent(email)}`);
        
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
      {/* 主题切换按钮 - 固定在右上角但不太显眼 */}
      <div className="fixed top-4 right-4 z-10 opacity-60 hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-white/50 dark:bg-zinc-800/50 hover:bg-white/80 dark:hover:bg-zinc-700/80"
          onClick={toggleTheme}
        >
          {theme === "light" ? (
            <Eye className="h-3.5 w-3.5 text-zinc-700" />
          ) : (
            <EyeOff className="h-3.5 w-3.5 text-zinc-300" />
          )}
          <span className="sr-only">切换主题</span>
        </Button>
      </div>

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
          </div>
        </div>
      </div>

      {/* 右侧功能介绍区域 - 新设计 */}
      <div className="hidden md:block w-1/2 p-8 md:p-12 flex items-center justify-center">
        <div className="h-full w-full flex flex-col justify-center">
          <div className="bg-[#f0eee6] dark:bg-zinc-900 rounded-2xl shadow-sm p-8 h-[calc(100vh-6rem)] max-h-[800px] overflow-auto">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-6">
              ScreenPipe 能为您做什么
            </h2>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <MonitorX size={20} className="text-teal-700" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">
                    隐私优先的屏幕分析
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-300">
                    所有数据在本地处理，确保您的屏幕内容不会离开您的设备，保护您的隐私安全。
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-700">
                    <path d="M21 16V8.00002C20.9996 7.6493 20.9071 7.30483 20.7315 7.00119C20.556 6.69754 20.3037 6.44539 20 6.27002L13 2.27002C12.696 2.09449 12.3511 2.00208 12 2.00208C11.6489 2.00208 11.304 2.09449 11 2.27002L4 6.27002C3.69626 6.44539 3.44398 6.69754 3.26846 7.00119C3.09294 7.30483 3.00036 7.6493 3 8.00002V16C3.00036 16.3508 3.09294 16.6952 3.26846 16.9989C3.44398 17.3025 3.69626 17.5547 4 17.73L11 21.73C11.304 21.9056 11.6489 21.998 12 21.998C12.3511 21.998 12.696 21.9056 13 21.73L20 17.73C20.3037 17.5547 20.556 17.3025 20.7315 16.9989C20.9071 16.6952 20.9996 16.3508 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.27002 6.96002L12 12L20.73 6.96002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">
                    智能内容分析
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-300">
                    自动识别屏幕内容，提取关键信息，帮助您更高效地处理和组织视频素材。
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-700">
                    <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8.59 13.51L15.42 17.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">
                    开发者友好
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-300">
                    提供强大的API和插件系统，让开发者能够轻松扩展和集成ScreenPipe的功能。
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-700">
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">
                    高度可定制
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-300">
                    根据您的需求自定义分析流程和输出结果，满足不同场景的使用需求。
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                ScreenPipe 持续更新中，更多功能即将推出。立即登录体验！
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
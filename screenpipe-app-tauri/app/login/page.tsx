"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { UserApi } from "@/lib/api";
import { useSettings } from "@/lib/hooks/use-settings";
import { platform } from "@tauri-apps/plugin-os";
import { motion } from "framer-motion";
import { ChevronRight, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function LoginPage() {
  const { saveSettings } = useSettings();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

    setIsEmailLoading(true);
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
        throw apiError;
      }
    } catch (error) {
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
      setIsEmailLoading(false);
    }
  };

  // 处理验证码输入
  const handleCodeChange = (index: number, value: string) => {
    // 只允许输入数字
    if (!/^\d*$/.test(value)) return;

    // 更新验证码
    const newCode = verificationCode.split('');
    newCode[index] = value.slice(-1); // 只取最后一个字符
    const updatedCode = newCode.join('');
    setVerificationCode(updatedCode);

    // 自动聚焦到下一个输入框
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  // 处理验证码输入框的键盘事件
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // 处理删除键
    if (e.key === 'Backspace') {
      if (!verificationCode[index] && index > 0) {
        // 如果当前框为空且不是第一个框，聚焦到前一个框
        codeInputRefs.current[index - 1]?.focus();
      }
    }
    // 处理左右箭头键
    else if (e.key === 'ArrowLeft' && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  // 处理粘贴事件
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    // 检查是否是6位数字
    if (/^\d{6}$/.test(pastedData)) {
      setVerificationCode(pastedData);
      // 填充所有输入框
      for (let i = 0; i < 6; i++) {
        if (codeInputRefs.current[i]) {
          codeInputRefs.current[i]!.value = pastedData[i];
        }
      }
      // 聚焦到最后一个输入框
      codeInputRefs.current[5]?.focus();
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
      const userApi = new UserApi();
      const response = await userApi.verifyEmailLogin(email, verificationCode);

      // 使用saveSettings代替updateSettings，确保设置被保存到本地存储
      await saveSettings({
        user: response.user,
        authToken: response.access_token
      });

      toast({
        title: "登录成功",
        description: "欢迎回到ScreenPipe",
      });

      // 使用setTimeout确保状态更新和toast显示后再跳转
      // 这样可以避免跳转延迟的感觉，因为用户已经看到了成功提示
      setTimeout(() => {
        router.push("/");
        // 强制刷新以确保路由更新
        router.refresh();
      }, 50); // 增加延迟时间，确保数据保存完成
    } catch (error) {
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
    // 设置Google登录按钮的加载状态
    setIsGoogleLoading(true);

    try {
      // 显示功能尚未完全实现的提示
      toast({
        title: "功能开发中",
        description: "Google登录功能尚未完全实现，请使用邮箱登录",
        variant: "default",
      });
    } finally {
      // 无论成功与否，都需要重置加载状态
      setTimeout(() => {
        setIsGoogleLoading(false);
      }, 1000);
    }

    // 暂时不执行实际的登录逻辑
    return;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* 顶部导航栏 */}
      <header className="w-full py-6 px-6 md:px-10 flex items-center">
        <div className="flex items-center">
          <span className="text-2xl md:text-3xl font-bold text-primary tracking-tight">Terix</span>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-0 -mt-16">
        {/* 登录大模块 */}
        <div className="w-full max-w-4xl flex flex-col items-center">
          {/* 标题 */}
          <div className="text-center mb-10 w-full">
            <h1 className="text-4xl font-bold mb-3 cn-text-title">登录</h1>
            <p className="text-muted-foreground max-w-md mx-auto">使用您的账号登录以访问所有功能</p>
          </div>

          {/* 登录表单区域 */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full flex flex-col md:flex-row"
          >
            {/* 左侧邮箱登录区域 */}
            <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
              {!showVerificationForm ? (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
                      邮箱地址
                    </label>
                    <Input
                      id="email"
                      placeholder="输入您的邮箱"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 bg-background border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-md"
                    />
                  </div>
                  <div className="pt-2">
                    <Button
                      className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md flex items-center justify-center transition-all"
                      onClick={handleLogin}
                      disabled={isEmailLoading}
                    >
                      {isEmailLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          处理中
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span>使用邮箱继续</span>
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-lg font-semibold mb-2 cn-text-title">验证您的邮箱</h2>
                    <div className="inline-flex flex-wrap justify-center items-center gap-x-1 text-sm mb-2">
                      <span className="text-muted-foreground">我们已向</span>
                      <span className="font-medium text-foreground max-w-full break-all">{email}</span>
                      <span className="text-muted-foreground">发送了验证码</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="verification-code-0" className="block text-sm font-medium text-foreground">
                      输入6位验证码
                    </label>
                    <div className="flex justify-between gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <div key={index} className="relative flex-1">
                          <input
                            ref={(el) => {
                              codeInputRefs.current[index] = el;
                            }}
                            id={`verification-code-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={verificationCode[index] || ''}
                            onChange={(e) => handleCodeChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            disabled={isVerifying}
                            autoComplete={index === 0 ? "one-time-code" : undefined}
                            className="w-full h-12 text-center text-xl font-medium bg-background border-input border rounded-md focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                            autoFocus={index === 0}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      验证码有效期为10分钟
                    </div>
                  </div>

                  <Button
                    onClick={handleVerifyCode}
                    disabled={isVerifying || verificationCode.length < 6}
                    className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md flex items-center justify-center transition-all"
                  >
                    {isVerifying ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        验证中
                      </div>
                    ) : "验证并登录"}
                  </Button>

                  <div className="text-center pt-2">
                    <Button
                      variant="link"
                      className="p-0 h-auto font-normal text-sm hover:no-underline"
                      onClick={handleResendCode}
                      disabled={isEmailLoading}
                    >
                      <span className="text-muted-foreground hover:text-muted-foreground">没收到验证码？</span>
                      <span className="text-primary hover:text-primary/80 ml-1">重新发送</span>
                      {isEmailLoading && <Loader2 className="inline ml-1 h-3 w-3 animate-spin" />}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* 中间分隔线和文字 */}
            <div className="hidden md:flex items-center justify-center relative">
              <div className="h-[80%] w-px absolute"></div>
              <div className="absolute bg-background px-4 py-1 text-muted-foreground text-sm font-medium">
                或
              </div>
            </div>

            {/* 右侧社交登录区域 */}
            <div className="w-full md:w-1/2 p-8 md:p-10 mt-4 md:mt-0 md:border-l border-t md:border-t-0 border-border flex flex-col justify-center">
              <div className="space-y-5">
                <h3 className="text-center text-sm font-medium text-muted-foreground mb-2">使用以下方式快速登录</h3>
                {/* Google登录按钮 */}
                <button
                  className="w-full flex items-center h-11 border border-input rounded-md overflow-hidden transition-all hover:border-primary/50"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                >
                  <div className="w-11 h-11 flex items-center justify-center">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-center text-sm font-medium py-2">
                    {isGoogleLoading ? "处理中..." : "使用Google继续"}
                  </div>
                </button>

                {/* X (Twitter) 登录按钮 */}
                <button
                  className="w-full flex items-center h-11 border border-input rounded-md overflow-hidden transition-all hover:border-primary/50"
                  onClick={() => toast({
                    title: "功能开发中",
                    description: "X登录功能尚未完全实现",
                  })}
                >
                  <div className="w-11 h-11 flex items-center justify-center bg-black">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                      <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-center text-sm font-medium py-2">
                    使用X继续
                  </div>
                </button>

                {/* SSO登录按钮 */}
                <button
                  className="w-full flex items-center h-11 border border-input rounded-md overflow-hidden transition-all hover:border-primary/50"
                  onClick={() => toast({
                    title: "功能开发中",
                    description: "SSO登录功能尚未完全实现",
                  })}
                >
                  <div className="w-11 h-11 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="10" r="3" />
                      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                    </svg>
                  </div>
                  <div className="flex-1 text-center text-sm font-medium py-2">
                    使用SSO登录
                  </div>
                </button>
              </div>
            </div>
          </motion.div>

          {/* 底部隐私条款 */}
          <div className="w-full mt-auto py-6 text-center text-xs mt-20">
            <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-6">
              <a href="https://www.google.com/terms" className="text-muted-foreground hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">
                服务条款
              </a>
              <a href="https://www.google.com/privacy" className="text-muted-foreground hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">
                隐私政策
              </a>
            </div>
            <div className="mt-2 text-muted-foreground/70">
              <p>© {new Date().getFullYear()} Terix Technology Inc. 保留所有权利</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
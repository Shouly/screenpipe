"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, ArrowLeft, Bug, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { UserApi } from "@/lib/api";
import { useSettings } from "@/lib/hooks/use-settings";
import { motion } from "framer-motion";

export default function WaitingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { updateSettings } = useSettings();
  const email = searchParams.get("email") || "";
  const [isDevMode, setIsDevMode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [devModeClickCount, setDevModeClickCount] = useState(0);
  
  // 处理返回登录页面
  const handleBackToLogin = () => {
    router.push("/login");
  };
  
  // 处理重新发送邮件
  const handleResendEmail = () => {
    // 这里可以实现重新发送邮件的逻辑
    // 简单起见，我们直接返回登录页面
    router.push(`/login?email=${encodeURIComponent(email)}`);
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
      
      // 更新设置中的用户数据和令牌
      updateSettings({ 
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
      }, 100);
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
  
  // 开发模式直接验证
  const handleDevModeVerify = () => {
    // 生成一个随机的验证码
    const mockCode = "ABC123";
    // 直接使用模拟验证码
    setVerificationCode(mockCode);
    // 提示用户
    toast({
      title: "开发模式",
      description: `已自动填入模拟验证码：${mockCode}`,
      variant: "default",
    });
  };
  
  // 切换开发模式
  const toggleDevMode = () => {
    setDevModeClickCount(prev => prev + 1);
  };

  // 当点击次数达到5次时激活开发模式
  useEffect(() => {
    if (devModeClickCount >= 5 && !isDevMode) {
      setIsDevMode(true);
      toast({
        title: "开发模式已激活",
        description: "现在可以使用开发测试功能",
        variant: "default",
      });
    }
  }, [devModeClickCount, isDevMode, toast]);
  
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800"
      >
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto w-16 h-16 mb-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center"
            onClick={toggleDevMode}
          >
            <Mail className="h-8 w-8 text-blue-500 dark:text-blue-400" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2"
          >
            检查您的邮箱
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-zinc-600 dark:text-zinc-300 mb-6"
          >
            我们已向 <span className="font-medium text-blue-600 dark:text-blue-400">{email}</span> 发送了一封包含6位验证码的邮件。请在下方输入验证码完成登录。
          </motion.p>
          
          {/* 验证码输入区域 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="space-y-4 mb-6"
          >
            <div className="flex flex-col space-y-2">
              <label htmlFor="verification-code" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-left">
                验证码
              </label>
              <div className="flex space-x-2">
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="请输入验证码"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="flex-1 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-50"
                  disabled={isVerifying}
                  autoComplete="one-time-code"
                />
                <Button 
                  onClick={handleVerifyCode}
                  disabled={isVerifying || !verificationCode.trim()}
                  className="bg-[#e25822] hover:bg-[#d24812] text-white transition-all duration-200"
                >
                  {isVerifying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex items-center justify-center space-x-2 text-sm text-zinc-500 dark:text-zinc-400 mb-8"
          >
            <Loader2 className="h-4 w-4 animate-spin text-blue-500 dark:text-blue-400" />
            <span>等待验证...</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="space-y-4"
          >
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              没有收到邮件？请检查您的垃圾邮件文件夹，或者
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
                onClick={handleBackToLogin}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回登录
              </Button>
              
              <Button
                variant="default"
                className="flex-1 bg-[#e25822] hover:bg-[#d24812] text-white transition-all duration-200"
                onClick={handleResendEmail}
              >
                重新发送
              </Button>
            </div>
            
            {/* 开发模式区域 */}
            {isDevMode && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800"
              >
                <p className="text-xs text-amber-500 mb-2">开发模式</p>
                <Button
                  variant="outline"
                  className="w-full border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all duration-200"
                  onClick={handleDevModeVerify}
                >
                  <Bug className="h-4 w-4 mr-2" />
                  模拟验证（开发测试用）
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 
"use client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useSettings } from "@/lib/hooks/use-settings";
import { 
  UserCog, 
  Mail, 
  Calendar, 
  Globe, 
  Shield, 
  Copy,
  CheckCircle
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export function AccountSection() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // 格式化日期显示
  const formatDate = (dateString?: string) => {
    if (!dateString) return "未知";
    try {
      return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return "日期格式错误";
    }
  };

  // 复制用户ID
  const copyUserId = () => {
    if (settings.user?.id) {
      navigator.clipboard.writeText(settings.user.id);
      setCopied(true);
      toast({
        title: "已复制",
        description: "用户ID已复制到剪贴板",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* 用户资料卡片 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* 顶部背景和头像 */}
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500"></div>
          <div className="absolute bottom-0 transform translate-y-1/2 left-8">
            <div className="h-24 w-24 rounded-full border-4 border-white overflow-hidden shadow-md">
              {settings.user?.avatar ? (
                <img 
                  src={settings.user.avatar} 
                  alt={settings.user.name} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-blue-50 flex items-center justify-center">
                  <UserCog className="h-12 w-12 text-blue-400" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 用户信息 */}
        <div className="pt-16 pb-6 px-8">
          <h3 className="text-2xl font-semibold text-gray-800">{settings.user?.name || "未知用户"}</h3>
          <div className="flex items-center mt-1 text-gray-500">
            <Mail className="h-4 w-4 mr-2" />
            <span>{settings.user?.email || "无邮箱"}</span>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                    <UserCog className="h-4 w-4 text-blue-500" />
                  </div>
                  <span>用户ID</span>
                </div>
                <div className="flex items-center">
                  <div className="max-w-[140px] truncate bg-gray-50 px-3 py-1 rounded-l-full">
                    {settings.user?.id || "未知"}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 rounded-l-none rounded-r-full bg-gray-50 hover:bg-gray-100 px-2"
                    onClick={copyUserId}
                  >
                    {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-gray-500" />}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center mr-3">
                    <Calendar className="h-4 w-4 text-green-500" />
                  </div>
                  <span>创建时间</span>
                </div>
                <div className="bg-gray-50 px-3 py-1 rounded-full">
                  {formatDate(settings.user?.created_at)}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center mr-3">
                    <Calendar className="h-4 w-4 text-purple-500" />
                  </div>
                  <span>最后登录</span>
                </div>
                <div className="bg-gray-50 px-3 py-1 rounded-full">
                  {formatDate(settings.user?.last_login_at)}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center mr-3">
                    <Globe className="h-4 w-4 text-orange-500" />
                  </div>
                  <span>登录IP</span>
                </div>
                <div className="bg-gray-50 px-3 py-1 rounded-full">
                  {settings.user?.last_login_ip || "未知"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 账户安全提示 */}
      <motion.div 
        className="bg-blue-50 rounded-xl shadow-sm overflow-hidden"
        whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}
        transition={{ duration: 0.2 }}
      >
        <div className="p-6">
          <div className="flex items-start">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-4">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-lg font-medium text-blue-800 mb-2">账户安全提示</h4>
              <p className="text-blue-700">为了保障您的账户安全，请定期更改密码并确保您的邮箱地址是最新的。如需更改账户信息，请联系管理员。</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

"use client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useSettings } from "@/lib/hooks/use-settings";
import { 
  UserCog, 
  Mail, 
  Calendar, 
  Globe, 
  Copy,
  CheckCircle,
  Camera,
  Edit,
  Clock,
  Shield,
  Zap
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AccountSection() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

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
    <motion.div 
      className="max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Tabs 
        defaultValue="profile" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="profile" className="data-[state=active]:bg-white">
              个人资料
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-white">
              活动记录
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 text-gray-600 border-gray-200">
            <Edit className="h-3.5 w-3.5" />
            编辑资料
          </Button>
        </div>

        <TabsContent value="profile" className="mt-0 space-y-6">
          {/* 个人资料卡片 */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-none shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* 头像部分 */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative group">
                      <Avatar className="h-28 w-28 border-4 border-white shadow-sm">
                        <AvatarImage src={settings.user?.avatar} alt={settings.user?.name || "用户头像"} />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                          {settings.user?.name ? settings.user.name.charAt(0).toUpperCase() : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer">
                        <Camera className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                      用户
                    </Badge>
                  </div>

                  {/* 用户信息部分 */}
                  <div className="flex-1 space-y-6">
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-800">{settings.user?.name || "未知用户"}</h3>
                      <div className="flex items-center mt-1 text-gray-500">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>{settings.user?.email || "无邮箱"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <UserCog className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-500">用户ID</p>
                          <div className="flex items-center mt-0.5">
                            <p className="text-sm font-medium text-gray-700 truncate max-w-[140px]">
                              {settings.user?.id || "未知"}
                            </p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 ml-1"
                              onClick={copyUserId}
                            >
                              {copied ? 
                                <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : 
                                <Copy className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                              }
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">创建时间</p>
                          <p className="text-sm font-medium text-gray-700 mt-0.5">
                            {formatDate(settings.user?.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">最后登录</p>
                          <p className="text-sm font-medium text-gray-700 mt-0.5">
                            {formatDate(settings.user?.last_login_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <Globe className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">登录IP</p>
                          <p className="text-sm font-medium text-gray-700 mt-0.5">
                            {settings.user?.last_login_ip || "未知"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 账户安全状态 */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-none shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium text-gray-800">账户安全状态</h3>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    安全
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">邮箱已验证</p>
                      <p className="text-xs text-gray-500 mt-0.5">您的邮箱已通过验证</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">密码强度良好</p>
                      <p className="text-xs text-gray-500 mt-0.5">您的密码安全性良好</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="activity" className="mt-0">
          {/* 账户活动 */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-none shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="space-y-0 divide-y divide-gray-100">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${index % 2 === 0 ? 'bg-blue-50' : 'bg-green-50'} flex items-center justify-center flex-shrink-0`}>
                            {index % 2 === 0 ? 
                              <UserCog className="h-4 w-4 text-blue-500" /> : 
                              <Edit className="h-4 w-4 text-green-500" />
                            }
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {index % 2 === 0 ? '登录成功' : '资料更新'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {index % 2 === 0 ? 
                                `从 ${settings.user?.last_login_ip || "未知IP"}` : 
                                '更新了个人信息'
                              }
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs font-normal">
                          {formatDate(new Date(Date.now() - index * 86400000).toISOString())}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

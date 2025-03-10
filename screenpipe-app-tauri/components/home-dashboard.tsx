"use client";

import { useHealthCheck } from "@/lib/hooks/use-health-check";
import { useSettings } from "@/lib/hooks/use-settings";
import { useSettingsDialog } from "@/lib/hooks/use-settings-dialog";
import { useStatusDialog } from "@/lib/hooks/use-status-dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  HardDrive,
  Package,
  RefreshCw,
  Settings,
  User,
  ShoppingBag,
  BarChart3,
  Zap,
  Calendar,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";

interface HomeDashboardProps {
  onNavigate?: (page: string) => void;
}

export default function HomeDashboard({ onNavigate }: HomeDashboardProps = {}) {
  const { health, isLoading } = useHealthCheck();
  const { settings, getDataDir } = useSettings();
  const { open: openStatusDialog } = useStatusDialog();
  const { setIsOpen: setSettingsOpen } = useSettingsDialog();
  const [diskUsage, setDiskUsage] = useState<{ used: number; total: number } | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 模拟获取磁盘使用情况
  useEffect(() => {
    const fetchDiskUsage = async () => {
      try {
        // 这里应该是实际获取磁盘使用情况的代码
        // 现在使用模拟数据
        setDiskUsage({
          used: 2.4, // GB
          total: 10, // GB
        });
      } catch (error) {
        console.error("获取磁盘使用情况失败:", error);
      }
    };

    fetchDiskUsage();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // 刷新数据的逻辑
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastRefreshed(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  // 获取系统状态颜色
  const getStatusColor = () => {
    if (!health || health.status === "loading") return "bg-yellow-500";

    const isVisionOk = health.frame_status === "ok" || health.frame_status === "disabled";
    const isAudioOk = health.audio_status === "ok" || health.audio_status === "disabled" || settings.disableAudio;
    const isUiOk = health.ui_status === "ok" || health.ui_status === "disabled" || !settings.enableUiMonitoring;

    return isVisionOk && isAudioOk && isUiOk ? "bg-green-500" : "bg-red-500";
  };

  // 获取系统状态消息
  const getStatusMessage = () => {
    if (!health || health.status === "loading")
      return "正在启动中...";

    let issues = [];
    if (health.frame_status !== "ok" && health.frame_status !== "disabled")
      issues.push("屏幕录制");
    if (!settings.disableAudio && health.audio_status !== "ok" && health.audio_status !== "disabled")
      issues.push("音频录制");
    if (settings.enableUiMonitoring && health.ui_status !== "ok" && health.ui_status !== "disabled")
      issues.push("UI监控");

    if (issues.length === 0) return "系统运行正常";
    return `${issues.join("和")}可能有问题`;
  };

  const statusColor = getStatusColor();
  const statusMessage = getStatusMessage();
  const isStatusOk = statusColor === "bg-green-500";

  // 处理快速操作卡片点击
  const handleQuickAction = (action: string) => {
    switch (action) {
      case "store":
        if (onNavigate) onNavigate("store");
        break;
      case "settings":
        setSettingsOpen(true);
        break;
      case "status":
        openStatusDialog();
        break;
      case "account":
        // 处理账户操作
        break;
      default:
        break;
    }
  };

  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
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

  return (
    <div className="p-6 min-h-full">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            欢迎使用 ScreenPipe
          </h1>
          <p className="text-muted-foreground mt-1">
            您的智能屏幕录制与处理平台
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 h-9 px-4"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          刷新
        </Button>
      </motion.div>

      {/* 状态概览 */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-10"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            系统概览
          </h2>
          <Badge variant={isStatusOk ? "default" : "destructive"} className={cn("px-3 py-1", isStatusOk ? "bg-green-100 text-green-800 hover:bg-green-100" : "")}>
            {isStatusOk ? "系统正常" : "需要注意"}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 状态卡片 */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden shadow-sm hover:shadow transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  系统状态
                </CardTitle>
                <CardDescription>
                  ScreenPipe 服务状态
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  {health?.status === "running" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="text-sm font-medium">
                    {getStatusMessage()}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openStatusDialog()}
                  className="w-full justify-between mt-2 text-primary"
                >
                  查看详情
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* 存储卡片 */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden shadow-sm hover:shadow transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Database className="h-4 w-4 text-secondary" />
                  </div>
                  存储状态
                </CardTitle>
                <CardDescription>
                  ScreenPipe 存储状态
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {diskUsage && (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">已使用空间</span>
                      <span className="text-sm font-medium">{Math.round((diskUsage.used / diskUsage.total) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(diskUsage.used / diskUsage.total) * 100} 
                      className="h-2 mb-3"
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">已用: {diskUsage.used} GB</span>
                      <span className="font-medium">可用: {(diskUsage.total - diskUsage.used).toFixed(1)} GB</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pipe卡片 */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden shadow-sm hover:shadow transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <Package className="h-4 w-4 text-accent" />
                  </div>
                  已安装的 Pipe
                </CardTitle>
                <CardDescription>
                  ScreenPipe 已安装的 Pipe
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl font-bold">12</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onNavigate && onNavigate("store")}
                  >
                    管理
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">已安装的 Pipe 数量</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* 快速操作 */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-10"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            快速操作
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          <motion.div variants={itemVariants}>
            <Card 
              className="cursor-pointer group overflow-hidden shadow-sm hover:shadow transition-all"
              onClick={() => handleQuickAction("store")}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium text-base mb-1 group-hover:text-primary transition-colors">浏览 Pipe 商店</h3>
                <p className="text-xs text-muted-foreground">查找和安装新的 Pipe</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card 
              className="cursor-pointer group overflow-hidden shadow-sm hover:shadow transition-all"
              onClick={() => handleQuickAction("settings")}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Settings className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="font-medium text-base mb-1 group-hover:text-secondary transition-colors">应用设置</h3>
                <p className="text-xs text-muted-foreground">配置应用参数和选项</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card 
              className="cursor-pointer group overflow-hidden shadow-sm hover:shadow transition-all"
              onClick={() => handleQuickAction("status")}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Activity className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-medium text-base mb-1 group-hover:text-accent transition-colors">系统状态</h3>
                <p className="text-xs text-muted-foreground">查看系统运行状态</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card 
              className="cursor-pointer group overflow-hidden shadow-sm hover:shadow transition-all"
              onClick={() => handleQuickAction("account")}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium text-base mb-1 group-hover:text-primary transition-colors">账户管理</h3>
                <p className="text-xs text-muted-foreground">管理您的账户信息</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* 最近活动 */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            最近活动
          </h2>
          <Button variant="ghost" size="sm" className="text-primary">
            查看全部 <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {/* 活动列表 */}
              <div className="divide-y divide-border">
                <div className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">系统启动</h4>
                    <Badge variant="outline" className="text-xs">今天</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">ScreenPipe 服务已成功启动</p>
                </div>
                <div className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">Pipe 更新</h4>
                    <Badge variant="outline" className="text-xs">昨天</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">2 个 Pipe 已更新到最新版本</p>
                </div>
                <div className="flex items-center justify-center p-6 text-muted-foreground text-sm">
                  没有更多活动
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
} 
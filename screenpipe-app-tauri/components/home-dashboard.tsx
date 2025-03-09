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
  ShoppingBag
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";

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

  return (
    <div className="p-5 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">欢迎使用 ScreenPipe</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          刷新
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* 状态卡片 */}
        <Card>
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
          <CardContent>
            {/* 状态内容 */}
            <div className="flex items-center gap-2 mb-2">
              {health?.status === "running" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              <span className="text-sm">
                {getStatusMessage()}
              </span>
            </div>
            {/* 其他状态信息 */}
          </CardContent>
        </Card>

        {/* 存储卡片 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                <Database className="h-4 w-4 text-secondary-foreground" />
              </div>
              存储状态
            </CardTitle>
            <CardDescription>
              ScreenPipe 存储状态
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 存储内容 */}
            {diskUsage && (
              <>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">已使用 {diskUsage.used} GB / {diskUsage.total} GB</span>
                  <span className="text-sm font-medium">{Math.round((diskUsage.used / diskUsage.total) * 100)}%</span>
                </div>
                <Progress value={(diskUsage.used / diskUsage.total) * 100} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">可用空间: {(diskUsage.total - diskUsage.used).toFixed(1)} GB</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pipe卡片 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <Package className="h-4 w-4 text-accent-foreground" />
              </div>
              已安装的 Pipe
            </CardTitle>
            <CardDescription>
              ScreenPipe 已安装的 Pipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Pipe内容 */}
            <div className="flex items-center justify-between">
              <span className="text-3xl font-semibold">12</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onNavigate && onNavigate("store")}
              >
                管理
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">已安装的 Pipe 数量</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">快速操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:bg-accent/10 transition-colors" onClick={() => handleQuickAction("store")}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-1">浏览 Pipe 商店</h3>
              <p className="text-xs text-muted-foreground">查找和安装新的 Pipe</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:bg-accent/10 transition-colors" onClick={() => handleQuickAction("settings")}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-3">
                <Settings className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="font-medium mb-1">应用设置</h3>
              <p className="text-xs text-muted-foreground">配置应用参数和选项</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:bg-accent/10 transition-colors" onClick={() => handleQuickAction("status")}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-3">
                <Activity className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-medium mb-1">系统状态</h3>
              <p className="text-xs text-muted-foreground">查看系统运行状态</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:bg-accent/10 transition-colors" onClick={() => handleQuickAction("account")}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-1">账户管理</h3>
              <p className="text-xs text-muted-foreground">管理您的账户信息</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 最近活动 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">最近活动</h2>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              暂无最近活动
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
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
  User
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
    <div className="container mx-auto p-6">
      {/* 顶部欢迎区域 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">欢迎回来，{settings.user?.name || "用户"}</h1>
          <p className="text-muted-foreground mt-1">
            今天是 {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center mt-4 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            刷新
          </Button>
          <p className="text-xs text-muted-foreground ml-3">
            上次更新: {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* 状态概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              系统状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {isStatusOk ? (
                  <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
                )}
                <div>
                  <p className="font-medium">{statusMessage}</p>
                  <p className="text-sm text-muted-foreground">
                    {isStatusOk ? "所有系统正常运行" : "点击查看详情"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openStatusDialog()}
                className="ml-auto"
              >
                详情
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <HardDrive className="h-5 w-5 mr-2" />
              存储状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            {diskUsage ? (
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">已使用 {diskUsage.used.toFixed(1)} GB / {diskUsage.total.toFixed(1)} GB</span>
                  <span className="text-sm font-medium">
                    {Math.round((diskUsage.used / diskUsage.total) * 100)}%
                  </span>
                </div>
                <Progress
                  value={(diskUsage.used / diskUsage.total) * 100}
                  className="h-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  可用空间: {(diskUsage.total - diskUsage.used).toFixed(1)} GB
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-16">
                <p className="text-muted-foreground">加载中...</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Package className="h-5 w-5 mr-2" />
              已安装的 Pipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">已安装的 Pipe 数量</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate && onNavigate("store")}
                className="ml-auto"
              >
                管理
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <h2 className="text-xl font-semibold mb-4">快速操作</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card 
          className="col-span-1 hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => handleQuickAction("store")}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <Package className="h-8 w-8 mb-2" />
            <p className="font-medium text-center">浏览 Pipe 商店</p>
          </CardContent>
        </Card>

        <Card 
          className="col-span-1 hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => handleQuickAction("settings")}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <Settings className="h-8 w-8 mb-2" />
            <p className="font-medium text-center">应用设置</p>
          </CardContent>
        </Card>

        <Card 
          className="col-span-1 hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => handleQuickAction("status")}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <Activity className="h-8 w-8 mb-2" />
            <p className="font-medium text-center">系统状态</p>
          </CardContent>
        </Card>

        <Card 
          className="col-span-1 hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => handleQuickAction("account")}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <User className="h-8 w-8 mb-2" />
            <p className="font-medium text-center">账户信息</p>
          </CardContent>
        </Card>
      </div>

      {/* 最近活动 */}
      <h2 className="text-xl font-semibold mb-4">最近活动</h2>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-4">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">安装了新的 Pipe: Example Pipe {index + 1}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(Date.now() - index * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
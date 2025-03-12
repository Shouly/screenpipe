"use client";

import { PipeApi } from "@/lib/api";
import { useHealthCheck } from "@/lib/hooks/use-health-check";
import { useSettings } from "@/lib/hooks/use-settings";
import { useSettingsDialog } from "@/lib/hooks/use-settings-dialog";
import { useStatusDialog } from "@/lib/hooks/use-status-dialog";
import { cn } from "@/lib/utils";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bookmark,
  CheckCircle,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  FileText,
  Layers,
  Package,
  Play,
  Puzzle,
  RefreshCw,
  Settings,
  ShoppingBag,
  Sparkles,
  User,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

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
  const [installedPipesCount, setInstalledPipesCount] = useState<number>(0);
  const [recentPipes, setRecentPipes] = useState<any[]>([]);
  const [isLoadingPipes, setIsLoadingPipes] = useState(true);

  // 获取已安装的Pipe数量和最近使用的Pipe
  useEffect(() => {
    const fetchPipes = async () => {
      try {
        setIsLoadingPipes(true);
        const pipeApi = new PipeApi();
        const pipes = await pipeApi.listPipes();
        setInstalledPipesCount(pipes.length);

        // 获取最近的3个Pipe
        const recent = pipes.slice(0, 3).map(pipe => ({
          id: pipe.id,
          name: pipe.id.split('/').pop() || pipe.id,
          port: pipe.port
        }));

        setRecentPipes(recent);
      } catch (error) {
        console.error("获取Pipe信息失败:", error);
      } finally {
        setIsLoadingPipes(false);
      }
    };

    fetchPipes();
  }, []);

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

      // 重新获取Pipe信息
      const pipeApi = new PipeApi();
      const pipes = await pipeApi.listPipes();
      setInstalledPipesCount(pipes.length);

      // 获取最近的3个Pipe
      const recent = pipes.slice(0, 3).map(pipe => ({
        id: pipe.id,
        name: pipe.id.split('/').pop() || pipe.id,
        port: pipe.port
      }));

      setRecentPipes(recent);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 打开Pipe窗口
  const handleOpenPipe = async (pipe: any) => {
    try {
      await invoke("open_pipe_window", {
        port: pipe.port,
        title: pipe.name,
      });
    } catch (error) {
      console.error("打开Pipe窗口失败:", error);
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
            欢迎使用 <span className="text-primary">ScreenPipe</span>
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 h-9 px-4 hover:border-primary hover:text-primary"
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
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span>系统概览</span>
          </h2>
          <Badge variant={isStatusOk ? "default" : "destructive"} className={cn("px-3 py-1", isStatusOk ? "bg-green-100 text-green-800 hover:bg-green-100" : "")}>
            {isStatusOk ? "系统正常" : "需要注意"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 状态卡片 */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all border border-border rounded-xl h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
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
                  className="w-full justify-between mt-2 text-primary hover:bg-primary/10 hover:text-primary"
                >
                  查看详情
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* 存储卡片 */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all border border-border rounded-xl h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
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
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all border border-border rounded-xl h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
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
                  <span className="text-3xl font-bold">{isLoadingPipes ? "..." : installedPipesCount}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate && onNavigate("store")}
                    className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
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

      {/* 最近使用的Pipe */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span>最近使用的 Pipe</span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate && onNavigate("store")}
            className="text-primary hover:bg-primary/10"
          >
            查看全部 <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {isLoadingPipes ? (
            // 加载状态
            Array(3).fill(0).map((_, index) => (
              <motion.div key={`skeleton-${index}`} variants={itemVariants}>
                <Card className="border border-border rounded-xl p-4 h-[140px] flex flex-col justify-between shadow-sm">
                  <div className="animate-pulse flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="animate-pulse mt-4 h-7 bg-muted rounded"></div>
                </Card>
              </motion.div>
            ))
          ) : recentPipes.length > 0 ? (
            // 有数据时显示Pipe卡片
            recentPipes.map((pipe, index) => (
              <motion.div key={pipe.id} variants={itemVariants}>
                <Card
                  className="border border-border rounded-xl p-4 hover:bg-accent/5 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md h-full flex flex-col justify-between"
                  onClick={() => handleOpenPipe(pipe)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Puzzle className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm tracking-tight truncate">
                        {pipe.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <span className="truncate text-[11px]">端口: {pipe.port}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-medium transition-colors rounded-lg h-7 w-full justify-center mt-4 border-border"
                  >
                    <Play className="h-3 w-3 mr-1.5" />
                    <span className="text-[11px]">打开</span>
                  </Button>
                </Card>
              </motion.div>
            ))
          ) : (
            // 没有数据时显示空状态
            <motion.div variants={itemVariants} className="md:col-span-3">
              <Card className="border border-border rounded-xl p-6 shadow-sm text-center">
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">暂无已安装的 Pipe</h3>
                  <p className="text-muted-foreground mb-4">前往 Pipe 商店安装您需要的功能</p>
                  <Button
                    onClick={() => onNavigate && onNavigate("store")}
                    className="gap-2 bg-primary hover:bg-primary/90 text-white"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    浏览 Pipe 商店
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* 快速操作 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>快速操作</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          <motion.div variants={itemVariants}>
            <Card
              className="cursor-pointer group overflow-hidden shadow-sm hover:shadow-md transition-all border border-border rounded-xl"
              onClick={() => handleQuickAction("store")}
            >
              <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">浏览 Pipe 商店</h3>
                <p className="text-[11px] text-muted-foreground">查找和安装新的 Pipe</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card
              className="cursor-pointer group overflow-hidden shadow-sm hover:shadow-md transition-all border border-border rounded-xl"
              onClick={() => handleQuickAction("settings")}
            >
              <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Settings className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="font-medium text-sm mb-1 group-hover:text-secondary transition-colors">应用设置</h3>
                <p className="text-[11px] text-muted-foreground">配置应用参数和选项</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card
              className="cursor-pointer group overflow-hidden shadow-sm hover:shadow-md transition-all border border-border rounded-xl"
              onClick={() => handleQuickAction("status")}
            >
              <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Activity className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-medium text-sm mb-1 group-hover:text-accent transition-colors">系统状态</h3>
                <p className="text-[11px] text-muted-foreground">查看系统运行状态</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card
              className="cursor-pointer group overflow-hidden shadow-sm hover:shadow-md transition-all border border-border rounded-xl"
              onClick={() => handleQuickAction("account")}
            >
              <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">账户管理</h3>
                <p className="text-[11px] text-muted-foreground">管理您的账户信息</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* 功能亮点 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>功能亮点</span>
          </h2>
        </div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-sm hover:shadow-md transition-all border border-border rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
                <div className="p-5 hover:bg-accent/5 transition-colors">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <Cpu className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-medium text-sm mb-1">智能处理</h4>
                    <p className="text-xs text-muted-foreground">自动分析和处理屏幕内容</p>
                  </div>
                </div>

                <div className="p-5 hover:bg-accent/5 transition-colors">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-3">
                      <Layers className="h-5 w-5 text-secondary" />
                    </div>
                    <h4 className="font-medium text-sm mb-1">可扩展性</h4>
                    <p className="text-xs text-muted-foreground">通过Pipe扩展更多功能</p>
                  </div>
                </div>

                <div className="p-5 hover:bg-accent/5 transition-colors">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>
                    <h4 className="font-medium text-sm mb-1">内容分析</h4>
                    <p className="text-xs text-muted-foreground">提取和分析屏幕内容</p>
                  </div>
                </div>

                <div className="p-5 hover:bg-accent/5 transition-colors">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <Bookmark className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-medium text-sm mb-1">自动化工作流</h4>
                    <p className="text-xs text-muted-foreground">创建自定义处理流程</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
} 
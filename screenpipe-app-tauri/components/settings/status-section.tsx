"use client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useHealthCheck } from "@/lib/hooks/use-health-check";
import { useSettings } from "@/lib/hooks/use-settings";
import { cn } from "@/lib/utils";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import { motion } from "framer-motion";
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Cpu,
    Folder,
    Mic,
    Monitor,
    RefreshCw,
    Terminal,
    XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { DevModeSettings } from "../dev-mode-settings";
import { LogFileButton } from "../log-file-button";
import { PermissionButtons } from "../status/permission-buttons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export function StatusSection() {
    const { health, isLoading, fetchHealth } = useHealthCheck();
    const { settings, getDataDir } = useSettings();
    const { toast } = useToast();
    const [localDataDir, setLocalDataDir] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        const loadDataDir = async () => {
            try {
                const dir = await getDataDir();
                setLocalDataDir(dir);
            } catch (error) {
                console.error("Failed to get data directory:", error);
            }
        };

        loadDataDir();
    }, [getDataDir]);

    const handleOpenDataDir = async () => {
        try {
            const dataDir = await getDataDir();
            await openUrl(dataDir);
        } catch (error) {
            console.error("Failed to open data directory:", error);
            toast({
                title: "错误",
                description: "无法打开数据目录。",
                variant: "destructive",
                duration: 3000,
            });
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            // 调用fetchHealth方法刷新状态
            if (typeof fetchHealth === 'function') {
                await fetchHealth();
            }

            toast({
                title: "已刷新",
                description: "系统状态已更新",
                duration: 2000,
            });
        } catch (error) {
            console.error("刷新状态失败:", error);
            toast({
                title: "刷新失败",
                description: "无法更新系统状态",
                variant: "destructive",
                duration: 3000,
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    const formatTimestamp = (timestamp: string | null) => {
        if (!timestamp) return "未知";
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (e) {
            return "日期格式错误";
        }
    };

    const getStatusColor = (
        status: string,
        frameStatus: string,
        audioStatus: string,
        uiStatus: string,
        audioDisabled: boolean,
        uiMonitoringEnabled: boolean
    ) => {
        if (status === "error") return "bg-red-500";
        if (frameStatus !== "ok") return "bg-red-500";
        if (!audioDisabled && audioStatus !== "ok") return "bg-red-500";
        if (uiMonitoringEnabled && uiStatus !== "ok") return "bg-red-500";
        return "bg-green-500";
    };

    const getStatusMessage = (
        status: string,
        frameStatus: string,
        audioStatus: string,
        uiStatus: string,
        audioDisabled: boolean,
        uiMonitoringEnabled: boolean
    ) => {
        if (status === "error") return "ScreenPipe 服务未运行";
        if (frameStatus !== "ok") return "屏幕录制未正常工作";
        if (!audioDisabled && audioStatus !== "ok") return "音频录制未正常工作";
        if (uiMonitoringEnabled && uiStatus !== "ok") return "UI监控未正常工作";
        return "所有系统正常运行";
    };

    const statusColor = getStatusColor(
        health?.status ?? "error",
        health?.frame_status ?? "",
        health?.audio_status ?? "",
        health?.ui_status ?? "",
        settings.disableAudio ?? false,
        settings.enableUiMonitoring ?? false
    );

    const statusMessage = getStatusMessage(
        health?.status ?? "error",
        health?.frame_status ?? "",
        health?.audio_status ?? "",
        health?.ui_status ?? "",
        settings.disableAudio ?? false,
        settings.enableUiMonitoring ?? false
    );

    const getStatusIcon = (status: string) => {
        if (status === "ok") return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        if (status === "error") return <XCircle className="h-5 w-5 text-red-500" />;
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    };

    return (
        <div className="space-y-6">
            {/* 状态概览卡片 */}
            <motion.div
                className="bg-white rounded-xl shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ${statusColor} mr-2 ${statusColor === "bg-red-500" ? "animate-pulse" : ""}`} />
                            <h3 className="text-lg font-medium">{statusMessage}</h3>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                            刷新状态
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        {/* 服务状态 */}
                        <div className="flex flex-col p-4 bg-gray-50 rounded-xl">
                            <h4 className="text-sm font-medium mb-3">服务状态</h4>
                            <div className="space-y-3 flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">屏幕录制</span>
                                    {getStatusIcon(health?.frame_status ?? "error")}
                                </div>
                                {!settings.disableAudio && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">音频录制</span>
                                        {getStatusIcon(health?.audio_status ?? "error")}
                                    </div>
                                )}
                                {settings.enableUiMonitoring && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">UI监控</span>
                                        {getStatusIcon(health?.ui_status ?? "error")}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 快速操作 */}
                        <div className="flex flex-col p-4 bg-gray-50 rounded-xl">
                            <h4 className="text-sm font-medium mb-3">快速操作</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center justify-center gap-1 h-9"
                                    onClick={handleOpenDataDir}
                                >
                                    <Folder className="h-4 w-4" />
                                    <span className="text-xs">数据目录</span>
                                </Button>
                                <LogFileButton
                                    className="flex items-center justify-center gap-1 h-9 text-xs"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center justify-center gap-1 h-9 col-span-2"
                                    onClick={() => setActiveTab("developer")}
                                >
                                    <Terminal className="h-4 w-4" />
                                    <span className="text-xs">开发者选项</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 标签页 */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="border-t">
                        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                            <TabsTrigger
                                value="overview"
                                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                状态详情
                            </TabsTrigger>
                            <TabsTrigger
                                value="permissions"
                                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                权限管理
                            </TabsTrigger>
                            <TabsTrigger
                                value="developer"
                                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                开发者选项
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* 状态详情标签页 */}
                    <TabsContent value="overview" className="p-6 pt-4">
                        <div className="grid grid-cols-1 gap-6">
                            {/* 屏幕录制状态 */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <Monitor className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium">屏幕录制</h4>
                                        <div className={`w-2 h-2 rounded-full ${health?.frame_status === "ok" ? "bg-green-500" : "bg-red-500"}`} />
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">
                                        状态: {health ? health.frame_status === "ok" ? "正常" : "错误" : "未知"}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="h-3 w-3" />
                                        <span>最后更新: {formatTimestamp(health?.last_frame_timestamp ?? null)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 音频录制状态 */}
                            {!settings.disableAudio && (
                                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                                        <Mic className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium">音频录制</h4>
                                            <div className={`w-2 h-2 rounded-full ${health?.audio_status === "ok" ? "bg-green-500" : "bg-red-500"}`} />
                                        </div>
                                        <p className="text-sm text-gray-500 mb-2">
                                            状态: {health ? health.audio_status === "ok" ? "正常" : "错误" : "未知"}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="h-3 w-3" />
                                            <span>最后更新: {formatTimestamp(health?.last_audio_timestamp ?? null)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* UI监控状态 */}
                            {settings.enableUiMonitoring && (
                                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                        <Activity className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium">UI监控</h4>
                                            <div className={`w-2 h-2 rounded-full ${health?.ui_status === "ok" ? "bg-green-500" : "bg-red-500"}`} />
                                        </div>
                                        <p className="text-sm text-gray-500 mb-2">
                                            状态: {health ? health.ui_status === "ok" ? "正常" : "错误" : "未知"}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="h-3 w-3" />
                                            <span>最后更新: {formatTimestamp(health?.last_ui_timestamp ?? null)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 系统信息 */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                                    <Cpu className="h-5 w-5 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium">系统信息</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">数据目录:</span>
                                            <span className="text-sm font-medium truncate max-w-[200px]">{localDataDir || "未知"}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">服务状态:</span>
                                            <span className="text-sm font-medium">{health?.status === "ok" ? "正常运行" : "异常"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* 权限管理标签页 */}
                    <TabsContent value="permissions" className="p-6 pt-4">
                        <div className="grid grid-cols-1 gap-6">
                            {/* 屏幕录制权限 */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <Monitor className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium">屏幕录制权限</h4>
                                        <PermissionButtons type="screen" />
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        屏幕录制需要系统权限才能捕获您的屏幕内容。请确保已授予相关权限。
                                    </p>
                                </div>
                            </div>

                            {/* 音频录制权限 */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                                    <Mic className="h-5 w-5 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium">音频录制权限</h4>
                                        <PermissionButtons type="audio" />
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        音频录制需要麦克风权限才能捕获系统声音。请确保已授予相关权限。
                                    </p>
                                </div>
                            </div>

                            {/* 辅助功能权限 */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                    <Activity className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium">辅助功能权限</h4>
                                        <PermissionButtons type="accessibility" />
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        UI监控需要辅助功能权限才能捕获界面元素。请确保已授予相关权限。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* 开发者选项标签页 */}
                    <TabsContent value="developer" className="p-6 pt-4">
                        <DevModeSettings localDataDir={localDataDir} />
                    </TabsContent>
                </Tabs>
            </motion.div>
        </div>
    );
} 
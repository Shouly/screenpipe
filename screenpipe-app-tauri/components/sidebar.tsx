"use client";
import HealthStatus from "@/components/screenpipe-status";
import { Button } from "@/components/ui/button";

import {
  InboxMessageAction,
  InboxMessages,
  Message,
} from "@/components/inbox-messages";
import { useSettingsDialog } from "@/lib/hooks/use-settings-dialog";
import { useSettings } from "@/lib/hooks/use-settings";
import { listen } from "@tauri-apps/api/event";
import localforage from "localforage";
import {
  Bell,
  Settings2,
  Activity,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useHealthCheck } from "@/lib/hooks/use-health-check";
import { useStatusDialog } from "@/lib/hooks/use-status-dialog";

export default function Sidebar() {
  const [showInbox, setShowInbox] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [expanded, setExpanded] = useState(false);
  const { settings } = useSettings();
  const { toast } = useToast();
  const { health } = useHealthCheck();
  const { open: openStatusDialog } = useStatusDialog();
  const [statusComponent] = useState(() => <HealthStatus className="hidden" />);

  const { setIsOpen: setSettingsOpen } = useSettingsDialog();

  useEffect(() => {
    const loadMessages = async () => {
      const savedMessages =
        await localforage.getItem<Message[]>("inboxMessages");
      if (savedMessages) {
        setMessages(savedMessages);
      }
    };

    loadMessages();

    const unlisten = listen<{
      title: string;
      body: string;
      actions?: InboxMessageAction[];
    }>("inbox-message-received", async (event) => {
      console.log("inbox-message-received", event);
      const newMessage: Message = {
        id: Date.now().toString(),
        title: event.payload.title,
        body: event.payload.body,
        date: new Date().toISOString(),
        read: false,
        actions: event.payload.actions,
      };
      setMessages((prevMessages) => {
        const updatedMessages = [newMessage, ...prevMessages];
        localforage.setItem("inboxMessages", updatedMessages);
        return updatedMessages;
      });
    });

    return () => {
      unlisten.then((unlistenFn) => unlistenFn());
    };
  }, []);

  const handleMessageRead = async (id: string) => {
    setMessages((prevMessages) => {
      const updatedMessages = prevMessages.map((msg) =>
        msg.id === id ? { ...msg, read: true } : msg
      );
      localforage.setItem("inboxMessages", updatedMessages);
      return updatedMessages;
    });
  };

  const handleMessageDelete = async (id: string) => {
    setMessages((prevMessages) => {
      const updatedMessages = prevMessages.filter((msg) => msg.id !== id);
      localforage.setItem("inboxMessages", updatedMessages);
      return updatedMessages;
    });
  };

  const handleClearAll = async () => {
    setMessages([]);
    await localforage.setItem("inboxMessages", []);
  };

  const unreadCount = messages.filter(msg => !msg.read).length;

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
  const isStatusError = statusColor === "bg-red-500";

  // 处理状态点击事件
  const handleStatusClick = () => {
    // 通过模拟点击原始的HealthStatus组件来打开状态对话框
    const statusElement = document.querySelector('.status-trigger');
    if (statusElement) {
      (statusElement as HTMLElement).click();
    } else {
      // 如果找不到元素，尝试使用hook方法
      openStatusDialog();
    }
  };

  return (
    <div 
      className={cn(
        "h-screen bg-background border-r flex flex-col py-4 transition-all duration-300",
        expanded ? "w-48" : "w-12 sm:w-14"
      )}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo 区域 */}
      <div className="flex justify-center mb-8">
        <div className="w-6 h-6 sm:w-8 sm:h-8">
          <img src="/logo.svg" alt="ScreenPipe" className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        {expanded && <span className="ml-2 font-semibold text-sm">ScreenPipe</span>}
      </div>
      
      {/* 主菜单项 */}
      <div className="flex-1 flex flex-col space-y-2 px-1 sm:px-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log("设置按钮被点击");
                  setSettingsOpen(true);
                }}
                className={cn(
                  "flex w-full p-1 sm:p-2 justify-start",
                  "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Settings2 className="h-4 w-4 sm:h-5 sm:w-5" />
                {expanded && <span className="ml-2 text-sm">设置</span>}
                {!expanded && <span className="sr-only">设置</span>}
              </Button>
            </TooltipTrigger>
            {!expanded && (
              <TooltipContent side="right">
                设置
              </TooltipContent>
            )}
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInbox(!showInbox)}
                className={cn(
                  "flex w-full relative p-1 sm:p-2 justify-start",
                  "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {expanded && <span className="ml-2 text-sm">通知</span>}
                {!expanded && <span className="sr-only">通知</span>}
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-3 w-3 sm:h-4 sm:w-4 flex items-center justify-center text-[8px] sm:text-xs">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            {!expanded && (
              <TooltipContent side="right">
                通知
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* 底部系统状态 */}
      <div className="mt-auto px-1 sm:px-2">
        <div className="hidden">
          <HealthStatus className="status-trigger" />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStatusClick}
                className={cn(
                  "flex w-full p-1 sm:p-2 justify-start relative",
                  "hover:bg-accent hover:text-accent-foreground",
                  isStatusError && "text-red-500"
                )}
              >
                <Activity className={cn(
                  "h-4 w-4 sm:h-5 sm:w-5",
                  isStatusError && "animate-pulse"
                )} />
                {expanded && (
                  <>
                    <span className="ml-2 text-sm truncate max-w-[80px]">{statusMessage}</span>
                    <span className={cn(
                      "absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full",
                      statusColor
                    )} />
                  </>
                )}
                {!expanded && (
                  <span className={cn(
                    "absolute top-0 right-0 w-2 h-2 rounded-full",
                    statusColor,
                    isStatusError && "animate-pulse"
                  )} />
                )}
                {!expanded && <span className="sr-only">系统状态</span>}
              </Button>
            </TooltipTrigger>
            {!expanded && (
              <TooltipContent side="right">
                {statusMessage}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* 通知弹出框 */}
      {showInbox && (
        <div className={cn(
          "absolute top-12 sm:top-16 z-50 bg-background border shadow-lg rounded-lg",
          expanded ? "left-48" : "left-12 sm:left-14"
        )}>
          <InboxMessages
            messages={messages}
            onMessageRead={handleMessageRead}
            onMessageDelete={handleMessageDelete}
            onClearAll={handleClearAll}
            onClose={() => setShowInbox(false)}
          />
        </div>
      )}
    </div>
  );
} 
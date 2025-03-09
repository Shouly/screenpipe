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
  Settings2
} from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [showInbox, setShowInbox] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { settings } = useSettings();
  const { toast } = useToast();

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

  return (
    <div className="h-screen w-12 sm:w-14 bg-background border-r flex flex-col py-4">
      {/* Logo 区域 - 只保留logo */}
      <div className="flex justify-center mb-8">
        <div className="w-6 h-6 sm:w-8 sm:h-8">
          <img src="/logo.svg" alt="ScreenPipe" className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
      </div>
      
      {/* 主菜单项 */}
      <div className="flex-1 flex flex-col space-y-2 px-1 sm:px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            console.log("设置按钮被点击");
            setSettingsOpen(true);
          }}
          className={cn(
            "flex justify-center w-full p-1 sm:p-2",
            "hover:bg-accent hover:text-accent-foreground"
          )}
          title="设置"
        >
          <Settings2 className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">设置</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInbox(!showInbox)}
          className={cn(
            "flex justify-center w-full relative p-1 sm:p-2",
            "hover:bg-accent hover:text-accent-foreground"
          )}
          title="通知"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">通知</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-3 w-3 sm:h-4 sm:w-4 flex items-center justify-center text-[8px] sm:text-xs">
              {unreadCount}
            </span>
          )}
        </Button>
      </div>
      
      {/* 底部系统状态 */}
      <div className="mt-auto px-1 sm:px-2 space-y-2">
        <div className="flex items-center justify-center py-1 sm:py-2" title="系统状态">
          <HealthStatus className="cursor-pointer scale-75 sm:scale-100" />
        </div>
      </div>
      
      {/* 通知弹出框 */}
      {showInbox && (
        <div className="absolute left-12 sm:left-14 top-12 sm:top-16 z-50 bg-background border shadow-lg rounded-lg">
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
"use client";

import { useSettingsDialog } from "@/lib/hooks/use-settings-dialog";
import { cn } from "@/lib/utils";
import { listen } from "@tauri-apps/api/event";
import localforage from "localforage";
import {
    Home,
    ShoppingBag,
    Bell,
    Settings
} from "lucide-react";
import { useEffect, useState } from "react";
import {
    InboxMessageAction,
    InboxMessages,
    Message,
} from "./inbox-messages";
import HealthStatus from "./screenpipe-status";
import { Button } from "./ui/button";

interface NavigationProps {
    activePage: string;
    onNavigate: (page: string) => void;
}

export default function Navigation({ activePage, onNavigate }: NavigationProps) {
    const [showInbox, setShowInbox] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
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

    // 处理设置点击，同时可以打开状态对话框
    const handleSettingsClick = () => {
        setSettingsOpen(true);
    };

    return (
        <>
            <div className="bg-muted flex flex-col py-4 fixed left-0 top-0 w-20 h-screen z-30">
                {/* Logo 区域 */}
                <div className="flex flex-col items-center justify-center mb-8 px-3">
                    <div className="w-10 h-10 flex-shrink-0">
                        <img src="/logo.svg" alt="ScreenPipe" className="w-10 h-10" />
                    </div>
                </div>

                {/* 主导航项 */}
                <div className="flex-1 flex flex-col space-y-6 px-2">
                    {/* 首页 */}
                    <Button
                        variant={activePage === "home" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => onNavigate("home")}
                        className={cn(
                            "flex flex-col items-center justify-center h-auto py-2 px-1 w-full",
                            "hover:bg-accent hover:text-primary rounded-lg transition-colors",
                            activePage === "home" ? "bg-accent text-primary" : ""
                        )}
                    >
                        <Home className="h-6 w-6 mb-1" />
                        <span className="text-xs text-center">首页</span>
                    </Button>

                    {/* Pipe商店 */}
                    <Button
                        variant={activePage === "store" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => onNavigate("store")}
                        className={cn(
                            "flex flex-col items-center justify-center h-auto py-2 px-1 w-full",
                            "hover:bg-accent hover:text-primary rounded-lg transition-colors",
                            activePage === "store" ? "bg-accent text-primary" : ""
                        )}
                    >
                        <ShoppingBag className="h-6 w-6 mb-1" />
                        <span className="text-xs text-center">商店</span>
                    </Button>
                </div>

                {/* 底部工具栏 */}
                <div className="mt-auto px-2 space-y-6 mb-4">
                    <div className="hidden">
                        <HealthStatus className="status-trigger" />
                    </div>

                    {/* 通知 */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowInbox(!showInbox)}
                        className={cn(
                            "flex flex-col items-center justify-center h-auto py-2 px-1 w-full relative",
                            "hover:bg-accent hover:text-primary rounded-lg transition-colors"
                        )}
                    >
                        <Bell className="h-6 w-6 mb-1" />
                        <span className="text-xs text-center">通知</span>
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-[8px] rounded-full h-4 w-4 flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </Button>

                    {/* 设置 */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSettingsClick}
                        className={cn(
                            "flex flex-col items-center justify-center h-auto py-2 px-1 w-full",
                            "hover:bg-accent hover:text-primary rounded-lg transition-colors"
                        )}
                    >
                        <Settings className="h-6 w-6 mb-1" />
                        <span className="text-xs text-center">设置</span>
                    </Button>
                </div>
            </div>

            {/* 通知面板 */}
            {showInbox && (
                <div className="fixed top-0 right-0 h-screen w-80 bg-muted border-l border-border shadow-lg z-50 rounded-l-xl">
                    <InboxMessages
                        messages={messages}
                        onClose={() => setShowInbox(false)}
                        onMessageRead={handleMessageRead}
                        onMessageDelete={handleMessageDelete}
                        onClearAll={handleClearAll}
                    />
                </div>
            )}
        </>
    );
} 
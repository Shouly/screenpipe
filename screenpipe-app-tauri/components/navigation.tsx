"use client";

import { useSettingsDialog } from "@/lib/hooks/use-settings-dialog";
import { cn } from "@/lib/utils";
import { listen } from "@tauri-apps/api/event";
import localforage from "localforage";
import {
    Bell,
    Home,
    Package,
    Settings2
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
    const [collapsed, setCollapsed] = useState(true);
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
            <div
                className="h-screen bg-background border-r flex flex-col py-4 relative"
                style={{
                    width: collapsed ? '64px' : '256px',
                    transition: 'width 0.2s ease-out'
                }}
                onMouseEnter={() => setCollapsed(false)}
                onMouseLeave={() => setCollapsed(true)}
            >
                {/* Logo 区域 */}
                <div className="flex items-center justify-center mb-8 px-4">
                    <div className="w-8 h-8 flex-shrink-0">
                        <img src="/logo.svg" alt="ScreenPipe" className="w-8 h-8" />
                    </div>
                    <span className={cn("ml-3 font-semibold text-lg whitespace-nowrap overflow-hidden",
                        collapsed ? "opacity-0 w-0" : "opacity-100 w-auto",
                        "transition-all duration-200"
                    )}>
                        ScreenPipe
                    </span>
                </div>

                {/* 主导航项 */}
                <div className="flex-1 flex flex-col space-y-1 px-2">
                    {/* 首页 */}
                    <Button
                        variant={activePage === "home" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => onNavigate("home")}
                        className={cn(
                            "flex w-full justify-start py-2",
                            "hover:bg-accent hover:text-accent-foreground",
                            collapsed ? "px-3" : "px-4"
                        )}
                    >
                        <Home className="h-5 w-5 flex-shrink-0" />
                        <span className={cn("ml-3 text-sm whitespace-nowrap overflow-hidden",
                            collapsed ? "opacity-0 w-0" : "opacity-100 w-auto",
                            "transition-all duration-200"
                        )}>
                            首页
                        </span>
                    </Button>

                    {/* Pipe商店 */}
                    <Button
                        variant={activePage === "store" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => onNavigate("store")}
                        className={cn(
                            "flex w-full justify-start py-2",
                            "hover:bg-accent hover:text-accent-foreground",
                            collapsed ? "px-3" : "px-4"
                        )}
                    >
                        <Package className="h-5 w-5 flex-shrink-0" />
                        <span className={cn("ml-3 text-sm whitespace-nowrap overflow-hidden",
                            collapsed ? "opacity-0 w-0" : "opacity-100 w-auto",
                            "transition-all duration-200"
                        )}>
                            Pipe商店
                        </span>
                    </Button>
                </div>

                {/* 底部工具栏 */}
                <div className="mt-auto px-2 space-y-1">
                    <div className="hidden">
                        <HealthStatus className="status-trigger" />
                    </div>

                    {/* 通知 */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowInbox(!showInbox)}
                        className={cn(
                            "flex w-full relative justify-start py-2",
                            "hover:bg-accent hover:text-accent-foreground",
                            collapsed ? "px-3" : "px-4"
                        )}
                    >
                        <Bell className="h-5 w-5 flex-shrink-0" />
                        <span className={cn("ml-3 text-sm whitespace-nowrap overflow-hidden",
                            collapsed ? "opacity-0 w-0" : "opacity-100 w-auto",
                            "transition-all duration-200"
                        )}>
                            通知
                        </span>
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
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
                            "flex w-full justify-start py-2",
                            "hover:bg-accent hover:text-accent-foreground",
                            collapsed ? "px-3" : "px-4"
                        )}
                    >
                        <Settings2 className="h-5 w-5 flex-shrink-0" />
                        <span className={cn("ml-3 text-sm whitespace-nowrap overflow-hidden",
                            collapsed ? "opacity-0 w-0" : "opacity-100 w-auto",
                            "transition-all duration-200"
                        )}>
                            设置
                        </span>
                    </Button>
                </div>
            </div>

            {/* 通知面板 */}
            {showInbox && (
                <div className="fixed top-0 right-0 h-screen w-80 bg-background border-l shadow-lg z-50">
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
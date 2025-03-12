"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { listen } from "@tauri-apps/api/event";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import localforage from "localforage";
import {
    Bell,
    Bot,
    CheckSquare,
    ChevronDown,
    ChevronUp,
    Maximize2,
    Search,
    X
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import {
    InboxMessageAction,
    Message
} from "./inbox-messages";
import { MemoizedReactMarkdown } from "./markdown";

interface NotificationsProps {
    onNavigate?: (page: string) => void;
}

export function Notifications({ onNavigate }: NotificationsProps = {}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
    const [dialogMessage, setDialogMessage] = useState<Message | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const loadMessages = async () => {
            const savedMessages = await localforage.getItem<Message[]>("inboxMessages");
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

    const handleMessageRead = useCallback((id: string) => {
        setMessages((prevMessages) => {
            const updatedMessages = prevMessages.map((msg) =>
                msg.id === id ? { ...msg, read: true } : msg
            );
            localforage.setItem("inboxMessages", updatedMessages);
            return updatedMessages;
        });
    }, []);

    const handleMessageDelete = useCallback((id: string) => {
        setMessages((prevMessages) => {
            const updatedMessages = prevMessages.filter((msg) => msg.id !== id);
            localforage.setItem("inboxMessages", updatedMessages);
            return updatedMessages;
        });
    }, []);

    const handleClearAll = useCallback(() => {
        setMessages([]);
        localforage.setItem("inboxMessages", []);
    }, []);

    const handleMarkAllAsRead = useCallback(() => {
        setMessages((prevMessages) => {
            const updatedMessages = prevMessages.map((msg) => ({
                ...msg,
                read: true
            }));
            localforage.setItem("inboxMessages", updatedMessages);
            return updatedMessages;
        });
    }, []);

    const toggleMessageExpansion = useCallback((id: string) => {
        setExpandedMessages((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const formatDate = useCallback((dateString: string) => {
        const date = new Date(dateString);
        return format(date, "yyyy年MM月dd日 HH:mm");
    }, []);

    const openDialog = useCallback((message: Message) => {
        setDialogMessage(message);
        setDialogOpen(true);
        if (!message.read) {
            handleMessageRead(message.id);
        }
    }, [handleMessageRead]);

    const closeDialog = useCallback(() => {
        setDialogOpen(false);
    }, []);

    const handleDeleteAndClose = useCallback(() => {
        if (dialogMessage) {
            handleMessageDelete(dialogMessage.id);
            closeDialog();
        }
    }, [dialogMessage, handleMessageDelete, closeDialog]);

    const handleAction = useCallback(async (actionId: string, port: number) => {
        try {
            const response = await fetch(`http://localhost:${port}/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: actionId }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error("failed to send action callback:", error);
        }
    }, []);

    const handleBackToHome = () => {
        if (onNavigate) {
            onNavigate("home");
        }
    };

    // 过滤消息
    const filteredMessages = messages
        .filter(msg => {
            // 根据标签页过滤
            if (activeTab === 'unread' && msg.read) return false;

            // 根据搜索词过滤
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                return (
                    msg.title.toLowerCase().includes(searchLower) ||
                    msg.body.toLowerCase().includes(searchLower)
                );
            }

            return true;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const unreadCount = messages.filter(msg => !msg.read).length;

    return (
        <div className="overflow-hidden flex flex-col h-full">
            <div className="p-7 flex flex-col flex-1 overflow-hidden space-y-7">
                {/* 标题栏 */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">通知<span className="text-primary">中心</span></h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {`共 ${messages.length} 条通知，其中 `}
                            <span className="text-primary font-medium">{unreadCount}</span>
                            {` 条未读`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            disabled={unreadCount === 0}
                            className="h-9 px-3 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                        >
                            <CheckSquare className="mr-2 h-4 w-4" />
                            标记全部已读
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearAll}
                            disabled={messages.length === 0}
                            className="h-9 px-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                        >
                            <X className="mr-2 h-4 w-4" />
                            清空全部
                        </Button>
                    </div>
                </motion.div>

                {/* 搜索栏和筛选 */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex items-center justify-between"
                >
                    <div className="relative w-full md:w-[420px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索通知..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 border-border focus-visible:ring-primary focus-visible:border-primary"
                            autoCorrect="off"
                            autoComplete="off"
                        />
                    </div>
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchQuery("")}
                            className="ml-2 text-xs text-muted-foreground hover:text-primary"
                        >
                            清除
                        </Button>
                    )}
                </motion.div>

                {/* 筛选标签 */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar"
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "rounded-full px-4 text-sm font-medium",
                            activeTab === 'all' && "bg-primary/10 text-primary font-medium"
                        )}
                        onClick={() => setActiveTab('all')}
                    >
                        全部通知
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "rounded-full px-4 text-sm font-medium",
                            activeTab === 'unread' && "bg-primary/10 text-primary font-medium"
                        )}
                        onClick={() => setActiveTab('unread')}
                    >
                        未读通知
                        {unreadCount > 0 && (
                            <span className="ml-1.5 bg-primary/20 text-primary text-xs rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </Button>

                    <div className="ml-auto flex items-center">
                        <span className="text-xs text-muted-foreground">
                            {filteredMessages.length} 条通知
                        </span>
                    </div>
                </motion.div>

                {/* 主内容区域 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex-1 overflow-y-auto pr-1"
                >
                    <AnimatePresence>
                        {filteredMessages.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-64 text-center bg-muted/30 rounded-xl p-8"
                            >
                                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                    <Bell className="h-8 w-8 text-muted-foreground/70" />
                                </div>
                                <p className="text-muted-foreground mb-2 text-lg">
                                    {searchQuery
                                        ? "没有找到匹配的通知"
                                        : `暂无${activeTab === 'unread' ? '未读' : ''}通知`}
                                </p>
                                {searchQuery && (
                                    <>
                                        <p className="text-muted-foreground/70 mb-4 text-sm">尝试使用不同的搜索词或清除筛选条件</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSearchQuery("")}
                                            className="mt-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                                        >
                                            清除搜索
                                        </Button>
                                    </>
                                )}
                            </motion.div>
                        ) : (
                            <div className="space-y-4">
                                {filteredMessages.map((message, index) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.3,
                                            delay: 0.05 * (index % 4),
                                            ease: "easeOut"
                                        }}
                                        onClick={() => {
                                            if (!message.read) {
                                                handleMessageRead(message.id);
                                            }
                                        }}
                                    >
                                        <Card className={`w-full ${message.read ? "bg-secondary/50" : "bg-background border-l-2 border-primary"} hover:shadow-md transition-shadow`}>
                                            <CardHeader className="flex flex-row items-center justify-between py-3">
                                                <div className="flex items-center space-x-2 flex-1 mr-2">
                                                    <Bot className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                    <h3 className="text-sm font-semibold" title={message.title}>
                                                        {message.title}
                                                    </h3>
                                                    {!message.read && (
                                                        <span className="bg-primary w-2 h-2 rounded-full" />
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatDate(message.date)}
                                                </span>
                                            </CardHeader>
                                            <CardContent className="py-2">
                                                <div className="w-full overflow-hidden">
                                                    <MemoizedReactMarkdown
                                                        className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 text-sm"
                                                        remarkPlugins={[remarkGfm, remarkMath]}
                                                        components={{
                                                            p: ({ children }) => (
                                                                <p className="mb-2 last:mb-0">{children}</p>
                                                            ),
                                                            a: ({ href, children, ...props }) => {
                                                                const isExternal =
                                                                    href?.startsWith("http") || href?.startsWith("https");
                                                                return (
                                                                    <a
                                                                        href={href}
                                                                        target={isExternal ? "_blank" : undefined}
                                                                        rel={isExternal ? "noopener noreferrer" : undefined}
                                                                        className="break-all text-blue-500 hover:underline"
                                                                        {...props}
                                                                    >
                                                                        {children}
                                                                    </a>
                                                                );
                                                            },
                                                        }}
                                                    >
                                                        {expandedMessages.has(message.id)
                                                            ? message.body || ""
                                                            : message.body?.length > 150
                                                                ? `${message.body.slice(0, 150)}...`
                                                                : message.body || ""}
                                                    </MemoizedReactMarkdown>
                                                </div>
                                                {message.body && message.body.length > 150 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleMessageExpansion(message.id);
                                                        }}
                                                        className="text-xs mt-2"
                                                    >
                                                        {expandedMessages.has(message.id) ? (
                                                            <>
                                                                <ChevronUp className="mr-1 h-4 w-4" />
                                                                收起
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronDown className="mr-1 h-4 w-4" />
                                                                展开
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </CardContent>
                                            <CardFooter className="flex justify-end space-x-2 py-2">
                                                {message.actions?.map((action) => (
                                                    <Button
                                                        key={`${message.id}-${action.action}`}
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAction(action.action, action.port);
                                                        }}
                                                        className="text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                                                    >
                                                        {action.label}
                                                    </Button>
                                                ))}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMessageDelete(message.id);
                                                    }}
                                                    className="text-xs"
                                                >
                                                    <X className="mr-1 h-4 w-4" />
                                                    删除
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDialog(message);
                                                    }}
                                                    className="text-xs hover:text-primary"
                                                >
                                                    <Maximize2 className="mr-1 h-4 w-4" />
                                                    查看详情
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* 详情对话框 */}
            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDialog();
                    }
                }}
            >
                <DialogContent
                    className="max-w-3xl max-h-[80vh] overflow-y-auto"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>{dialogMessage?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <MemoizedReactMarkdown
                            className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
                            remarkPlugins={[remarkGfm, remarkMath]}
                            components={{
                                p: ({ children }) => (
                                    <p className="mb-2 last:mb-0">{children}</p>
                                ),
                                a: ({ href, children, ...props }) => (
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="break-all"
                                        {...props}
                                    >
                                        {children}
                                    </a>
                                ),
                            }}
                        >
                            {dialogMessage?.body || ""}
                        </MemoizedReactMarkdown>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                        {dialogMessage?.actions?.map((action) => (
                            <Button
                                key={`dialog-${dialogMessage.id}-${action.action}`}
                                variant="outline"
                                onClick={() => handleAction(action.action, action.port)}
                            >
                                {action.label}
                            </Button>
                        ))}
                        <DialogClose asChild>
                            <Button variant="outline" onClick={closeDialog}>
                                关闭
                            </Button>
                        </DialogClose>
                        <Button variant="default" onClick={handleDeleteAndClose} className="bg-primary hover:bg-primary/90">
                            删除
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
} 
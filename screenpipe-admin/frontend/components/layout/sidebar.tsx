"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  BarChart2, 
  Monitor, 
  EyeIcon, 
  LockIcon, 
  Puzzle,
  Home,
  Settings,
  HelpCircle,
  Users,
  Bell,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function Sidebar({ className, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navItems: NavItem[] = [
    {
      href: "/",
      label: "仪表盘",
      icon: <Home className="h-5 w-5" />,
    },
    {
      href: "/productivity",
      label: "生产力分析",
      icon: <BarChart2 className="h-5 w-5" />,
    },
    {
      href: "/ui-monitoring",
      label: "UI监控",
      icon: <Monitor className="h-5 w-5" />,
    },
    {
      href: "/ocr-text",
      label: "OCR文本",
      icon: <EyeIcon className="h-5 w-5" />,
    },
    {
      href: "/remote-control",
      label: "远程控制",
      icon: <LockIcon className="h-5 w-5" />,
    },
    {
      href: "/plugin-management",
      label: "插件管理",
      icon: <Puzzle className="h-5 w-5" />,
    },
    {
      href: "/users",
      label: "用户管理",
      icon: <Users className="h-5 w-5" />,
    },
    {
      href: "/notifications",
      label: "通知中心",
      icon: <Bell className="h-5 w-5" />,
    },
    {
      href: "/settings",
      label: "系统设置",
      icon: <Settings className="h-5 w-5" />,
    },
    {
      href: "/help",
      label: "帮助中心",
      icon: <HelpCircle className="h-5 w-5" />,
    },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex flex-col border-r bg-sidebar transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-[240px]",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BarChart2 className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg">Time Glass</span>
          )}
        </Link>
        
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isCollapsed ? "展开侧边栏" : "收起侧边栏"}
            </span>
          </Button>
        )}
      </div>
      
      <div className="flex-1 py-2 h-[calc(100vh-8rem)] overflow-y-auto">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "w-full justify-start font-normal",
                isActive(item.href) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                isCollapsed && "justify-center px-0"
              )}
            >
              <Link href={item.href} className="flex items-center">
                <span className={cn("mr-2", isCollapsed && "mr-0")}>{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            </Button>
          ))}
        </nav>
      </div>
      
      {/* 用户信息区域 */}
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn(
              "w-full justify-start font-normal",
              isCollapsed && "justify-center px-0"
            )}>
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">
                  {user?.name?.charAt(0) || "U"}
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{user?.name || "用户"}</span>
                    <span className="text-xs text-muted-foreground">{user?.email || "用户邮箱"}</span>
                  </div>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isCollapsed ? "center" : "end"} className="w-56 rounded-xl overflow-hidden">
            <DropdownMenuLabel className="font-medium">我的账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>个人资料</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>设置</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="rounded-lg cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
} 
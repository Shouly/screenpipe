"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  BarChart2, 
  Menu, 
  Monitor, 
  EyeIcon, 
  LockIcon, 
  Puzzle, 
  User, 
  Settings, 
  LogOut,
  HelpCircle,
  ChevronDown,
  LogIn
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

// 定义导航项类型
interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
  hasSubmenu?: boolean;
}

// 临时Avatar组件，如果没有实际组件，可以创建一个
const Avatar = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={cn("relative inline-flex items-center justify-center overflow-hidden rounded-full", className)}>
    {children}
  </div>
);

const AvatarImage = ({ src, alt }: { src: string, alt: string }) => (
  <img src={src} alt={alt} className="h-full w-full object-cover" />
);

const AvatarFallback = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={cn("flex h-full w-full items-center justify-center", className)}>
    {children}
  </div>
);

export function Header() {
  const pathname = usePathname() || "";
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // 公开导航项
  const publicNavItems: NavItem[] = [
    { href: "/", label: "首页" },
    { href: "/about", label: "关于我们" },
  ];

  // 需要登录才能访问的导航项
  const privateNavItems: NavItem[] = [
    { 
      href: "/productivity", 
      label: "生产力分析", 
      icon: <BarChart2 className="mr-2 h-4 w-4" />,
      hasSubmenu: false // 修改为false，因为只有一个应用使用分析页面
    },
    { href: "/ui-monitoring", label: "UI监控", icon: <Monitor className="mr-2 h-4 w-4" /> },
    { href: "/ocr-text", label: "OCR文本", icon: <EyeIcon className="mr-2 h-4 w-4" /> },
    { href: "/remote-control", label: "远程控制", icon: <LockIcon className="mr-2 h-4 w-4" /> },
    { href: "/plugin-management", label: "插件管理", icon: <Puzzle className="mr-2 h-4 w-4" /> },
  ];

  // 根据登录状态选择显示的导航项
  const navItems = isAuthenticated ? [...publicNavItems, ...privateNavItems] : publicNavItems;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BarChart2 className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl hidden sm:inline-block">Time Glass</span>
          </Link>
        </div>

        <div className="hidden md:flex">
          <nav className="flex items-center space-x-1 text-sm font-medium">
            {navItems.map((item) => (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md transition-colors hover:bg-accent",
                    isActive(item.href) 
                      ? "text-primary font-medium" 
                      : "text-foreground/70 hover:text-foreground"
                  )}
                >
                  {item.label}
                  {item.hasSubmenu && (
                    <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
                  )}
                </Link>
                
                {item.hasSubmenu && (
                  <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="bg-card rounded-md shadow-md border p-2 w-48">
                      <Link 
                        href="/productivity/app-usage" 
                        className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent"
                      >
                        应用使用分析
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            // 已登录状态
            <>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <span className="sr-only">帮助</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="/avatar.png" alt="用户头像" />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>个人资料</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>设置</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            // 未登录状态
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">
                  登录
                </Link>
              </Button>
              <Button asChild>
                <Link href="/register">
                  注册
                </Link>
              </Button>
            </>
          )}

          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">打开菜单</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center">
                      {item.icon && item.icon}
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                
                {/* 移除子菜单，因为生产力分析页面只有一个页面 */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
} 
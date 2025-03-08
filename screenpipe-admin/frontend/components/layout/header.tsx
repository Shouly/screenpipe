"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarChart2, Menu, Monitor, EyeIcon, LockIcon, Puzzle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname() || "";

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const navItems = [
    { href: "/", label: "首页" },
    { href: "/productivity/app-usage", label: "应用使用分析", icon: <BarChart2 className="mr-2 h-4 w-4" /> },
    { href: "/ui-monitoring", label: "UI监控", icon: <Monitor className="mr-2 h-4 w-4" /> },
    { href: "/ocr-text", label: "OCR文本", icon: <EyeIcon className="mr-2 h-4 w-4" /> },
    { href: "/remote-control", label: "远程控制", icon: <LockIcon className="mr-2 h-4 w-4" /> },
    { href: "/plugin-management", label: "插件管理", icon: <Puzzle className="mr-2 h-4 w-4" /> },
    { href: "/about", label: "关于" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">Time Glass</span>
          </Link>
        </div>

        <div className="hidden md:flex">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-foreground/80 ${isActive(item.href) ? "text-foreground" : "text-foreground/60"
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">打开菜单</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>
                    {item.icon && item.icon}
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 
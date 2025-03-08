"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Brain, Home, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();
  
  const navItems = [
    {
      name: "首页",
      href: "/",
      icon: Home,
      active: pathname === "/"
    },
    {
      name: "活动分析",
      href: "/app-usage",
      icon: Clock,
      active: pathname.startsWith("/app-usage")
    },
    {
      name: "工作日志",
      href: "/log",
      icon: Brain,
      active: pathname.startsWith("/log")
    }
  ];
  
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-md flex items-center justify-center">
                <span className="text-white dark:text-gray-900 font-mono text-xs font-bold">SP</span>
              </div>
              <span className="font-bold text-lg">time glass</span>
            </Link>
            
            <nav className="ml-8 hidden md:flex">
              <ul className="flex space-x-2">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                        item.active
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                      )}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
      
      {/* 移动端导航 */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-800 fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 z-10">
        <div className="grid grid-cols-3 h-16">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center",
                item.active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
} 
"use client";

import { BarChart2 } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
              <BarChart2 className="h-3 w-3 text-primary" />
            </div>
            <span className="text-sm font-medium">员工生产力分析平台</span>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()}
            </p>
            <Link href="#" className="transition-colors hover:text-primary">
              隐私政策
            </Link>
            <Link href="#" className="transition-colors hover:text-primary">
              服务条款
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 
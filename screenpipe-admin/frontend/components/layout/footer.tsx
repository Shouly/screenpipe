"use client";

import { BarChart2, Github, Twitter, Mail, Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <BarChart2 className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg">Time Glass</span>
            </div>
            <p className="text-sm text-muted-foreground">
              员工生产力分析平台，帮助企业提升团队效率，优化资源配置。
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium">产品</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/productivity" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  生产力分析
                </Link>
              </li>
              <li>
                <Link href="/ui-monitoring" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  UI监控
                </Link>
              </li>
              <li>
                <Link href="/ocr-text" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  OCR文本
                </Link>
              </li>
              <li>
                <Link href="/remote-control" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  远程控制
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium">公司</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  关于我们
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  联系我们
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  加入我们
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  博客
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium">联系我们</h3>
            <p className="text-sm text-muted-foreground">
              订阅我们的新闻通讯，获取最新产品更新和行业洞察。
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Github className="h-4 w-4" />
                <span className="sr-only">Github</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Twitter className="h-4 w-4" />
                <span className="sr-only">Twitter</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Mail className="h-4 w-4" />
                <span className="sr-only">Email</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Time Glass. 保留所有权利。</p>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              隐私政策
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              服务条款
            </Link>
            <Link href="/cookies" className="hover:text-primary transition-colors">
              Cookie 政策
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 
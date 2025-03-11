"use client";

import { BarChart2, Github, Twitter, Mail, Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">TG</span>
              </div>
              <h3 className="font-bold text-lg">Time Glass</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              全面监控、深入分析、优化员工工作效率，提升企业整体生产力
            </p>
          </div>
          
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">产品</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/productivity" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    生产力分析
                  </Link>
                </li>
                <li>
                  <Link href="/ui-monitoring" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    UI监控
                  </Link>
                </li>
                <li>
                  <Link href="/ocr-text" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    OCR文本
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">资源</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    文档
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    API
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    支持
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">公司</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    关于我们
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    联系我们
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    隐私政策
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="canva-divider mt-6 mb-4"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Time Glass. 保留所有权利。
          </p>
          
          <div className="flex items-center space-x-4">
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="sr-only">微信</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wechat">
                <path d="M9.5 9.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5h.5c1.1 0 2-.9 2-2s-.9-2-2-2H7.82C6.26 2.5 5 3.76 5 5.32V12c0 2.76 2.24 5 5 5h4c2.76 0 5-2.24 5-5v-2.08c0-1.24-1.01-2.25-2.25-2.25H15c-.55 0-1 .45-1 1v.5c0 .83-.67 1.5-1.5 1.5h-3z" />
              </svg>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="sr-only">QQ</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 16c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" />
                <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="sr-only">邮箱</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 
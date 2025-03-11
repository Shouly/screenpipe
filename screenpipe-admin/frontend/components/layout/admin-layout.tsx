"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        onToggleCollapse={toggleSidebar}
      />
      <div
        className={cn(
          "min-h-screen transition-all duration-300",
          sidebarCollapsed ? "ml-[70px]" : "ml-[240px]"
        )}
      >
        <main className="p-8">
          <div className="content-container bg-background rounded-xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 
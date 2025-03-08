"use client";

import { AppUsageData } from "@/lib/types";
import { Search, Clock } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface AppListProps {
  data: AppUsageData;
}

export function AppList({ data }: AppListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}小时 ${mins}分钟`;
    }
    
    return `${mins}分钟`;
  };
  
  // 过滤应用列表
  const filteredApps = data.appUsage.filter(app => 
    app.appName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 计算最长使用时间，用于进度条
  const maxMinutes = Math.max(...filteredApps.map(app => app.minutes), 1);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <h3 className="text-base font-medium text-gray-500">应用使用情况</h3>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10 h-9 w-full sm:w-64 rounded-md bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus-visible:ring-1 focus-visible:ring-gray-400 focus-visible:ring-offset-0"
            placeholder="搜索应用..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-4 py-2.5 bg-gray-50 dark:bg-gray-900">
          <div className="col-span-7">应用</div>
          <div className="col-span-5">使用时间</div>
        </div>
        
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
          {filteredApps.map((app) => (
            <div 
              key={app.appName}
              className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <div className="col-span-7 flex items-center">
                <div className="w-8 h-8 mr-3 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                  {app.icon ? (
                    <img 
                      src={app.icon} 
                      alt={app.appName} 
                      className="w-6 h-6 object-contain"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-300 dark:bg-gray-700 rounded-md" />
                  )}
                </div>
                <span className="font-medium text-sm truncate">{app.appName}</span>
              </div>
              
              <div className="col-span-5 flex flex-col justify-center">
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 mb-1">
                  <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                  {formatTime(app.minutes)}
                </div>
                <Progress 
                  value={(app.minutes / maxMinutes) * 100} 
                  className="h-1.5" 
                  style={{
                    "--progress-color": app.category === "productivity" 
                      ? "rgb(59, 130, 246)" 
                      : app.category === "tools" 
                        ? "rgb(245, 158, 11)" 
                        : "rgb(6, 182, 212)"
                  } as React.CSSProperties}
                />
              </div>
            </div>
          ))}
          
          {filteredApps.length === 0 && (
            <div className="flex items-center justify-center py-10 text-gray-500 text-sm">
              没有找到匹配的应用
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
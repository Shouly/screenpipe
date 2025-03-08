"use client";

import { AppUsageData } from "@/lib/types";
import { Clock, PieChart } from "lucide-react";

interface UsageOverviewProps {
  data: AppUsageData;
}

export function UsageOverview({ data }: UsageOverviewProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}小时 ${mins}分钟`;
    }
    
    return `${mins}分钟`;
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-6">
        <Clock className="h-12 w-12 text-blue-500 mr-4" />
        <div>
          <p className="text-sm text-gray-500 mb-1">今日总使用时间</p>
          <h2 className="text-4xl font-bold">
            {formatTime(data.totalUsageMinutes)}
          </h2>
        </div>
      </div>
      
      <div className="mt-8">
        <div className="flex items-center mb-4">
          <PieChart className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-medium">按类别划分</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {data.categoryUsage.map((category) => (
            <div 
              key={category.category} 
              className="flex flex-col p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center mb-3">
                <div 
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm font-medium">{category.category}</span>
              </div>
              <span className="text-2xl font-bold">{formatTime(category.minutes)}</span>
              <span className="text-xs text-gray-500 mt-1">
                {Math.round((category.minutes / data.totalUsageMinutes) * 100)}% 的总时间
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
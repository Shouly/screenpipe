"use client";

import { AppUsageData } from "@/lib/types";
import { useEffect, useRef } from "react";

interface DailyUsageChartProps {
  data: AppUsageData;
}

export function DailyUsageChart({ data }: DailyUsageChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  
  // 计算最大值，用于确定图表高度
  const maxDailyUsage = Math.max(
    ...data.dailyUsage.map((day) => day.totalMinutes)
  );
  
  // 计算平均值
  const averageDailyUsage = 
    data.dailyUsage.reduce((sum, day) => sum + day.totalMinutes, 0) / 
    data.dailyUsage.length;
  
  // 格式化日期标签
  const formatDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dayOfWeek = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
    
    if (date.toDateString() === today.toDateString()) {
      return "今";
    }
    
    return dayOfWeek;
  };
  
  // 计算柱状图高度百分比
  const getBarHeight = (minutes: number) => {
    if (maxDailyUsage === 0) return 0;
    return (minutes / maxDailyUsage) * 100;
  };
  
  // 计算平均线位置
  const getAverageLinePosition = () => {
    if (maxDailyUsage === 0) return 0;
    return 100 - (averageDailyUsage / maxDailyUsage) * 100;
  };

  return (
    <div className="flex flex-col mt-8">
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {Math.round(maxDailyUsage / 60)}小时
        </div>
      </div>
      
      <div 
        ref={chartRef}
        className="relative h-40 mt-2 flex items-end justify-between"
      >
        {/* 平均线 */}
        <div 
          className="absolute w-full border-t border-dashed border-green-500 z-10"
          style={{ bottom: `${getAverageLinePosition()}%` }}
        />
        <div 
          className="absolute right-0 text-xs text-green-500"
          style={{ bottom: `${getAverageLinePosition()}%`, transform: 'translateY(-50%)' }}
        >
          平均
        </div>
        
        {/* 柱状图 */}
        {data.dailyUsage.slice().reverse().map((day, index) => (
          <div key={day.date} className="flex flex-col items-center w-full">
            <div className="relative h-full w-12 flex items-end">
              {/* 生产力部分 */}
              <div 
                className="absolute bottom-0 w-full bg-blue-500"
                style={{ 
                  height: `${getBarHeight(day.categories.productivity)}%`,
                }}
              />
              
              {/* 工具部分 */}
              <div 
                className="absolute w-full bg-orange-500"
                style={{ 
                  height: `${getBarHeight(day.categories.tools)}%`,
                  bottom: `${getBarHeight(day.categories.productivity)}%`
                }}
              />
              
              {/* 其他部分 */}
              <div 
                className="absolute w-full bg-cyan-400"
                style={{ 
                  height: `${getBarHeight(day.categories.other)}%`,
                  bottom: `${getBarHeight(day.categories.productivity + day.categories.tools)}%`
                }}
              />
            </div>
            
            <div className="mt-2 text-xs">
              {formatDayLabel(day.date)}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <div className="text-xs text-gray-500">0</div>
      </div>
    </div>
  );
} 
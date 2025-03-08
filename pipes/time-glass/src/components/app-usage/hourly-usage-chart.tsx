"use client";

import { AppUsageData } from "@/lib/types";
import { useRef } from "react";

interface HourlyUsageChartProps {
  data: AppUsageData;
}

export function HourlyUsageChart({ data }: HourlyUsageChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  
  // 计算最大值，用于确定图表高度
  const maxHourlyUsage = Math.max(
    ...data.hourlyUsage.map((hour) => hour.minutes)
  );
  
  // 格式化小时标签
  const formatHourLabel = (hour: number) => {
    return `${hour}时`;
  };
  
  // 计算柱状图高度百分比
  const getBarHeight = (minutes: number) => {
    if (maxHourlyUsage === 0) return 0;
    return (minutes / maxHourlyUsage) * 100;
  };

  return (
    <div className="flex flex-col mt-8">
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {Math.round(maxHourlyUsage)}分钟
        </div>
      </div>
      
      <div 
        ref={chartRef}
        className="relative h-40 mt-2 flex items-end justify-between overflow-x-auto"
      >
        {/* 柱状图 */}
        {data.hourlyUsage.map((hour) => (
          <div key={hour.hour} className="flex flex-col items-center min-w-8">
            <div className="relative h-full w-6 flex items-end">
              {/* 生产力部分 */}
              <div 
                className="absolute bottom-0 w-full bg-blue-500"
                style={{ 
                  height: `${getBarHeight(hour.categories.productivity)}%`,
                }}
              />
              
              {/* 工具部分 */}
              <div 
                className="absolute w-full bg-orange-500"
                style={{ 
                  height: `${getBarHeight(hour.categories.tools)}%`,
                  bottom: `${getBarHeight(hour.categories.productivity)}%`
                }}
              />
              
              {/* 其他部分 */}
              <div 
                className="absolute w-full bg-cyan-400"
                style={{ 
                  height: `${getBarHeight(hour.categories.other)}%`,
                  bottom: `${getBarHeight(hour.categories.productivity + hour.categories.tools)}%`
                }}
              />
            </div>
            
            {/* 只显示部分小时标签，避免拥挤 */}
            {hour.hour % 6 === 0 && (
              <div className="mt-2 text-xs whitespace-nowrap">
                {formatHourLabel(hour.hour)}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <div className="text-xs text-gray-500">0</div>
        <div className="text-xs text-gray-500">30分钟</div>
      </div>
    </div>
  );
} 
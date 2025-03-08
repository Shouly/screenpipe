import { NextResponse } from "next/server";
import { pipe } from "@screenpipe/js";
import { AppUsageData, AppCategory } from "@/lib/types";

// 预定义的应用类别
const APP_CATEGORIES: Record<string, AppCategory> = {
  productivity: {
    id: "productivity",
    name: "效率与财务",
    color: "#0066ff",
    apps: ["Cursor", "IntelliJ IDEA", "Sublime Text", "Arc", "iTerm", "screenpipe", "Obsidian", "Visual Studio Code", "Xcode"]
  },
  tools: {
    id: "tools",
    name: "工具",
    color: "#ff9500",
    apps: ["钉钉", "钉钉会议与直播", "微信", "QQ", "Slack", "Discord", "Telegram", "Zoom", "Microsoft Teams"]
  },
  other: {
    id: "other",
    name: "其他",
    color: "#5ac8fa",
    apps: []
  }
};

// 获取应用类别
function getAppCategory(appName: string) {
  for (const categoryKey in APP_CATEGORIES) {
    const category = APP_CATEGORIES[categoryKey as keyof typeof APP_CATEGORIES];
    if (category.apps.includes(appName)) {
      return category.id;
    }
  }
  return "other";
}

// 获取类别颜色
function getCategoryColor(categoryId: string) {
  return APP_CATEGORIES[categoryId as keyof typeof APP_CATEGORIES]?.color || APP_CATEGORIES.other.color;
}

// 获取类别名称
function getCategoryName(categoryId: string) {
  return APP_CATEGORIES[categoryId as keyof typeof APP_CATEGORIES]?.name || APP_CATEGORIES.other.name;
}

// 从screenpipe数据库中获取应用使用时间数据
async function getAppUsageData(date: string): Promise<AppUsageData> {
  try {
    // 获取当天的开始和结束时间
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    console.log("查询时间范围:", {
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString()
    }); // 添加日志以便调试
    
    // 使用pipe.queryScreenpipe API获取应用使用数据
    const appUsageResults = await pipe.queryScreenpipe({
      contentType: "ui", // 获取UI数据，包含应用信息
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      limit: 1000 // 获取足够多的数据以计算使用时间
    });
    
    // 打印结果的结构和示例数据，帮助我们了解实际的数据格式
    if (appUsageResults && appUsageResults.data) {
      console.log("appUsageResults structure:", JSON.stringify({
        count: appUsageResults.data.length,
        firstItem: appUsageResults.data[0] ? {
          keys: Object.keys(appUsageResults.data[0]),
          sample: appUsageResults.data[0]
        } : null
      }, null, 2));
    } else {
      console.log("appUsageResults is null or has no data");
    }
    
    // 处理API返回的数据，计算每个应用的使用时间
    const appUsageMap = new Map<string, { minutes: number, icon: string }>();
    
    // 处理数据，计算每个应用的使用时间
    if (appUsageResults && appUsageResults.data && appUsageResults.data.length > 0) {
      let lastTimestamp: number | null = null;
      let lastAppName: string | null = null;
      
      // 按时间排序
      const sortedData = [...appUsageResults.data].sort((a, b) => {
        // 正确访问content.timestamp字段
        const timeA = new Date(a.content?.timestamp || 0).getTime();
        const timeB = new Date(b.content?.timestamp || 0).getTime();
        return timeA - timeB;
      });
      
      for (const item of sortedData) {
        if (item.content && typeof item.content === 'object' && 'appName' in item.content) {
          const appName = item.content.appName as string;
          // 正确访问content.timestamp字段
          const timestamp = new Date(item.content.timestamp || 0).getTime();
          
          // 计算时间差并添加到上一个应用的使用时间
          if (lastTimestamp && lastAppName) {
            const timeDiff = (timestamp - lastTimestamp) / 1000 / 60; // 转换为分钟
            
            if (timeDiff > 0 && timeDiff < 30) { // 忽略超过30分钟的间隔（可能是电脑空闲）
              const currentApp = appUsageMap.get(lastAppName) || { minutes: 0, icon: getAppIcon(lastAppName) };
              currentApp.minutes += timeDiff;
              appUsageMap.set(lastAppName, currentApp);
            }
          }
          
          // 更新最后的应用和时间戳
          lastAppName = appName;
          lastTimestamp = timestamp;
          
          // 确保应用在Map中
          if (!appUsageMap.has(appName)) {
            appUsageMap.set(appName, { minutes: 0, icon: getAppIcon(appName) });
          }
        }
      }
    }
    
    // 转换Map为数组并按使用时间排序
    const appUsage = Array.from(appUsageMap.entries())
      .map(([appName, data]) => ({
        appName,
        minutes: Math.round(data.minutes), // 四舍五入到整数分钟
        icon: data.icon,
        category: getAppCategory(appName)
      }))
      .filter(app => app.minutes > 0) // 只保留有使用时间的应用
      .sort((a, b) => b.minutes - a.minutes); // 按使用时间降序排序
    
    // 计算总使用时间
    const totalUsageMinutes = appUsage.reduce((total, app) => total + app.minutes, 0);
    
    // 计算每个类别的使用时间
    const categoryUsage = Object.keys(APP_CATEGORIES).map(categoryId => {
      const minutes = appUsage
        .filter(app => app.category === categoryId)
        .reduce((total, app) => total + app.minutes, 0);
      
      return {
        category: getCategoryName(categoryId),
        minutes,
        color: getCategoryColor(categoryId)
      };
    }).filter(category => category.minutes > 0);
    
    // 获取过去7天的使用数据
    const dailyUsage = await getDailyUsageData(date);
    
    // 获取当天的每小时使用数据
    const hourlyUsage = await getHourlyUsageData(date);
    
    return {
      totalUsageMinutes,
      dailyUsage,
      hourlyUsage,
      appUsage,
      categoryUsage
    };
  } catch (error) {
    console.error("Error fetching app usage data:", error);
    throw error;
  }
}

// 获取应用图标
function getAppIcon(appName: string): string {
  // 映射应用名称到图标路径
  const iconMap: Record<string, string> = {
    "Arc": "/app-icons/arc.png",
    "Cursor": "/app-icons/cursor.png",
    "钉钉": "/app-icons/dingtalk.png",
    "screenpipe": "/app-icons/screenpipe.png",
    "iTerm": "/app-icons/iterm.png",
    "IntelliJ IDEA": "/app-icons/idea.png",
    "Sublime Text": "/app-icons/sublime.png",
    "钉钉会议与直播": "/app-icons/dingtalk-meeting.png",
    "Obsidian": "/app-icons/obsidian.png",
    "Visual Studio Code": "/app-icons/vscode.png",
    "Xcode": "/app-icons/xcode.png",
    "微信": "/app-icons/wechat.png",
    "QQ": "/app-icons/qq.png",
    "Slack": "/app-icons/slack.png",
    "Discord": "/app-icons/discord.png",
    "Telegram": "/app-icons/telegram.png",
    "Zoom": "/app-icons/zoom.png",
    "Microsoft Teams": "/app-icons/teams.png"
  };
  
  return iconMap[appName] || "/app-icons/default.png";
}

// 获取过去7天的每日使用数据
async function getDailyUsageData(currentDate: string): Promise<Array<{
  date: string;
  totalMinutes: number;
  categories: Record<string, number>;
}>> {
  const result = [];
  const today = new Date(currentDate);
  
  // 获取过去7天的数据
  for (let i = 0; i < 7; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dateStr = day.toISOString().split('T')[0];
    
    try {
      // 对于今天，我们已经有了详细数据，直接使用
      if (i === 0) {
        // 这部分数据会在调用函数中计算
        const isToday = true;
        // 这里会在外部函数中填充实际数据
        result.push({
          date: dateStr,
          totalMinutes: 0, // 临时值，会被外部函数更新
          categories: {
            productivity: 0,
            tools: 0,
            other: 0
          }
        });
      } else {
        // 对于过去的日期，查询基本使用数据
        const startDate = new Date(dateStr);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(dateStr);
        endDate.setHours(23, 59, 59, 999);
        
        // 使用简化查询获取历史数据
        const historicalData = await pipe.queryScreenpipe({
          contentType: "ui",
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          limit: 500 // 减少数据量以提高性能
        });
        
        // 简化的使用时间计算
        let totalMinutes = 0;
        const categoryMinutes = {
          productivity: 0,
          tools: 0,
          other: 0
        };
        
        if (historicalData && historicalData.data && historicalData.data.length > 0) {
          // 简单估算：每条记录代表一定的使用时间
          const appCounts = new Map<string, number>();
          
          for (const item of historicalData.data) {
            if (item.content && typeof item.content === 'object' && 'appName' in item.content) {
              const appName = item.content.appName as string;
              appCounts.set(appName, (appCounts.get(appName) || 0) + 1);
            }
          }
          
          // 转换计数为分钟（简化估算）
          for (const [appName, count] of appCounts.entries()) {
            // 假设每条记录代表约0.5分钟的使用时间
            const minutes = Math.round(count * 0.5);
            const category = getAppCategory(appName);
            
            totalMinutes += minutes;
            categoryMinutes[category as keyof typeof categoryMinutes] += minutes;
          }
        }
        
        result.push({
          date: dateStr,
          totalMinutes,
          categories: categoryMinutes
        });
      }
    } catch (error) {
      console.error(`Error fetching data for ${dateStr}:`, error);
      // 如果出错，添加空数据
      result.push({
        date: dateStr,
        totalMinutes: 0,
        categories: {
          productivity: 0,
          tools: 0,
          other: 0
        }
      });
    }
  }
  
  return result;
}

// 获取当天的每小时使用数据
async function getHourlyUsageData(date: string): Promise<Array<{
  hour: number;
  minutes: number;
  categories: Record<string, number>;
}>> {
  const result = [];
  const targetDate = new Date(date);
  
  // 为每个小时创建数据结构
  for (let hour = 0; hour < 24; hour++) {
    // 设置查询的开始和结束时间
    const startTime = new Date(targetDate);
    startTime.setHours(hour, 0, 0, 0);
    
    const endTime = new Date(targetDate);
    endTime.setHours(hour, 59, 59, 999);
    
    try {
      // 查询该小时的数据
      const hourData = await pipe.queryScreenpipe({
        contentType: "ui",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        limit: 200
      });
      
      // 计算该小时的使用时间
      let totalMinutes = 0;
      const categoryMinutes = {
        productivity: 0,
        tools: 0,
        other: 0
      };
      
      if (hourData && hourData.data && hourData.data.length > 0) {
        const appCounts = new Map<string, number>();
        
        for (const item of hourData.data) {
          if (item.content && typeof item.content === 'object' && 'appName' in item.content) {
            const appName = item.content.appName as string;
            appCounts.set(appName, (appCounts.get(appName) || 0) + 1);
          }
        }
        
        // 转换计数为分钟
        for (const [appName, count] of appCounts.entries()) {
          // 假设每条记录代表约0.5分钟的使用时间
          const minutes = Math.min(60, Math.round(count * 0.5)); // 限制最大为60分钟
          const category = getAppCategory(appName);
          
          totalMinutes += minutes;
          categoryMinutes[category as keyof typeof categoryMinutes] += minutes;
        }
      }
      
      result.push({
        hour,
        minutes: totalMinutes,
        categories: categoryMinutes
      });
    } catch (error) {
      console.error(`Error fetching data for hour ${hour}:`, error);
      // 如果出错，添加空数据
      result.push({
        hour,
        minutes: 0,
        categories: {
          productivity: 0,
          tools: 0,
          other: 0
        }
      });
    }
  }
  
  return result;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") || new Date().toISOString().split('T')[0];
    
    console.log("API接收到的日期:", date); // 添加日志以便调试
    
    const data = await getAppUsageData(date);
    
    // 更新dailyUsage中今天的数据
    if (data.dailyUsage && data.dailyUsage.length > 0) {
      const todayIndex = data.dailyUsage.findIndex(d => d.date === date);
      if (todayIndex !== -1) {
        data.dailyUsage[todayIndex].totalMinutes = data.totalUsageMinutes;
        data.dailyUsage[todayIndex].categories = {
          productivity: data.categoryUsage.find(c => c.category === "效率与财务")?.minutes || 0,
          tools: data.categoryUsage.find(c => c.category === "工具")?.minutes || 0,
          other: data.categoryUsage.find(c => c.category === "其他")?.minutes || 0
        };
      }
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in app-usage API:", error);
    return NextResponse.json(
      { error: `Failed to get app usage data: ${error}` },
      { status: 500 }
    );
  }
} 
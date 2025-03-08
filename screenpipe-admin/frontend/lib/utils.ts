import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化时间（秒）为可读格式
export function formatTimeSpent(seconds: number): string {
  // 确保秒数为整数
  seconds = Math.round(seconds);
  
  if (seconds < 60) {
    return `${seconds}秒`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0
      ? `${minutes}分钟${remainingSeconds}秒`
      : `${minutes}分钟`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours < 24) {
    return remainingMinutes > 0
      ? `${hours}小时${remainingMinutes}分钟`
      : `${hours}小时`
  }

  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24

  return remainingHours > 0
    ? `${days}天${remainingHours}小时`
    : `${days}天`
}

// 计算百分比并格式化
export function formatPercentage(value: number, total: number): string {
  if (total === 0) return "0%"
  return `${Math.round((value / total) * 100)}%`
}

// 获取生产力类型对应的颜色
export function getProductivityColor(type: string): string {
  switch (type.toLowerCase()) {
    case "productive":
      return "bg-green-500"
    case "distracting":
      return "bg-red-500"
    case "neutral":
      return "bg-blue-500"
    default:
      return "bg-gray-500"
  }
}

// 将秒数转换为小时数（保留1位小数）
export function secondsToHours(seconds: number): number {
  // 确保秒数为整数
  seconds = Math.round(seconds);
  // 转换为小时并保留1位小数
  return Math.round((seconds / 3600) * 10) / 10;
}

// 获取过去N天的日期数组
export function getLastNDays(n: number): string[] {
  const result: string[] = []
  const today = new Date()

  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    result.push(date.toISOString().split('T')[0])
  }

  return result
}

// 将分钟转换为小时和分钟的可读格式
export function formatMinutes(minutes: number): string {
  // 确保分钟数为整数
  minutes = Math.round(minutes);
  
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}小时`;
  }
  
  return `${hours}小时${remainingMinutes}分钟`;
}

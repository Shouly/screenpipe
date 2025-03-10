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

// 从 screenpipe-app-tauri 添加的工具函数
export function stripAnsiCodes(str: string): string {
  return str.replace(/\x1B\[[0-9;]*[JKmsu]/g, "");
}

export function toCamelCase(str: string): string {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", "")
  );
}

export function keysToCamelCase<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamelCase<T>(v)) as any;
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [toCamelCase(key)]: keysToCamelCase(obj[key]),
      }),
      {}
    ) as T;
  }
  return obj;
}

export function encode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
    return "%" + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

export const convertHtmlToMarkdown = (html: string) => {
  const convertedHtml = html.replace(
    /<img\s+(?:[^>]*?\s+)?src="([^"]*)"(?:\s+(?:[^>]*?\s+)?alt="([^"]*)")?\s*\/?>/g,
    (match, src, alt) => {
      return `![${alt || ""}](${src})`;
    }
  );
  return convertedHtml.replace(/<[^>]*>/g, "");
};

export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }
  return color;
}

// Helper functions to flatten/unflatten objects
export const flattenObject = (obj: any, prefix = ""): Record<string, any> => {
  return Object.keys(obj).reduce((acc: Record<string, any>, k: string) => {
    const pre = prefix.length ? prefix + "." : "";
    if (
      typeof obj[k] === "object" &&
      obj[k] !== null &&
      !Array.isArray(obj[k])
    ) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
};

export const unflattenObject = (obj: Record<string, any>): any => {
  const result: any = {};
  for (const key in obj) {
    const keys = key.split(".");
    let current = result;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (i === keys.length - 1) {
        current[k] = obj[key];
      } else {
        current[k] = current[k] || {};
        current = current[k];
      }
    }
  }
  return result;
};

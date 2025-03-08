import type { Settings as ScreenpipeAppSettings } from "@screenpipe/js";

export interface WorkLog {
  title: string;
  description: string;
  tags: string[];
  startTime: string;
  endTime: string;
}

export interface Contact {
  name: string;
  company?: string;
  lastInteraction: string;
  sentiment: number;
  topics: string[];
  nextSteps: string[];
}

export interface Intelligence {
  contacts: Contact[];
  insights: {
    followUps: string[];
    opportunities: string[];
  };
}

export interface Settings {
  prompt: string;
  vaultPath: string;
  logTimeWindow: number;
  logPageSize: number;
  logModel: string;
  analysisModel: string;
  analysisTimeWindow: number;
  deduplicationEnabled: boolean;
  screenpipeAppSettings: ScreenpipeAppSettings;
}

export interface AppUsageData {
  totalUsageMinutes: number;
  dailyUsage: {
    date: string;
    totalMinutes: number;
    categories: {
      [category: string]: number; // 分钟数
    };
  }[];
  hourlyUsage: {
    hour: number;
    minutes: number;
    categories: {
      [category: string]: number;
    };
  }[];
  appUsage: {
    appName: string;
    icon?: string;
    minutes: number;
    category: string;
    limit?: number;
  }[];
  categoryUsage: {
    category: string;
    minutes: number;
    color: string;
  }[];
}

export interface AppCategory {
  id: string;
  name: string;
  color: string;
  apps: string[];
}

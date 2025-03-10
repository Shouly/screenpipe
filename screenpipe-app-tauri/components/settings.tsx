"use client";

import { useSettings } from "@/lib/hooks/use-settings";
import { useSettingsDialog } from "@/lib/hooks/use-settings-dialog";
import { useStatusDialog } from "@/lib/hooks/use-status-dialog";
import { cn } from "@/lib/utils";
import {
  Activity,
  Brain,
  FolderInput,
  HardDrive,
  Keyboard,
  LogOut,
  Search,
  Settings as SettingsIcon,
  User,
  Video,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccountSection } from "./settings/account-section";
import AISection from "./settings/ai-section";
import { DataImportSection } from "./settings/data-import-section";
import DiskUsage from "./settings/disk-usage";
import GeneralSettings from "./settings/general-settings";
import { RecordingSettings } from "./settings/recording-settings";
import ShortcutSection from "./settings/shortcut-section";
import { StatusSection } from "./settings/status-section";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type SettingsSection =
  | "general"
  | "ai"
  | "shortcuts"
  | "recording"
  | "account"
  | "diskUsage"
  | "dataImport"
  | "status";

interface SettingsProps {
  onNavigate?: (page: string) => void;
}

export function Settings({ onNavigate }: SettingsProps = {}) {
  const { isOpen, setIsOpen: setSettingsOpen } = useSettingsDialog();
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [searchQuery, setSearchQuery] = useState("");
  const { settings, updateSettings } = useSettings();
  const { open: openStatusDialog } = useStatusDialog();
  const router = useRouter();

  const settingsSections = [
    {
      id: "account",
      label: "个人资料",
      icon: <User className="h-4 w-4" />,
      category: "账户"
    },
    {
      id: "general",
      label: "通用",
      icon: <SettingsIcon className="h-4 w-4" />,
      category: "应用"
    },
    {
      id: "status",
      label: "系统状态",
      icon: <Activity className="h-4 w-4" />,
      category: "应用"
    },
    {
      id: "shortcuts",
      label: "快捷键",
      icon: <Keyboard className="h-4 w-4" />,
      category: "应用"
    },
    {
      id: "recording",
      label: "录制",
      icon: <Video className="h-4 w-4" />,
      category: "功能"
    },
    {
      id: "ai",
      label: "AI 设置",
      icon: <Brain className="h-4 w-4" />,
      category: "功能"
    },
    {
      id: "diskUsage",
      label: "磁盘使用",
      icon: <HardDrive className="h-4 w-4" />,
      category: "数据"
    },
    {
      id: "dataImport",
      label: "数据导入",
      icon: <FolderInput className="h-4 w-4" />,
      category: "数据"
    },
  ];

  // 过滤设置项
  const filteredSections = settingsSections.filter((section) => {
    if (!searchQuery) return true;
    return section.label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 按类别分组
  const groupedSections = filteredSections.reduce((acc, section) => {
    if (!acc[section.category]) {
      acc[section.category] = [];
    }
    acc[section.category].push(section);
    return acc;
  }, {} as Record<string, typeof settingsSections>);

  // 渲染当前活动的设置部分
  const renderActiveSection = () => {
    switch (activeSection) {
      case "account":
        return <AccountSection />;
      case "general":
        return <GeneralSettings />;
      case "shortcuts":
        return <ShortcutSection />;
      case "recording":
        return <RecordingSettings />;
      case "ai":
        return <AISection />;
      case "diskUsage":
        return <DiskUsage />;
      case "dataImport":
        return <DataImportSection />;
      case "status":
        return <StatusSection />;
      default:
        return null;
    }
  };

  // 获取当前部分的标题和描述
  const getSectionInfo = (section: SettingsSection) => {
    switch (section) {
      case "account":
        return { title: "个人资料", description: "管理您的账户信息" };
      case "general":
        return { title: "通用设置", description: "应用的基本设置" };
      case "shortcuts":
        return { title: "快捷键", description: "自定义键盘快捷键" };
      case "recording":
        return { title: "录制设置", description: "配置录制选项" };
      case "ai":
        return { title: "AI 设置", description: "配置 AI 功能" };
      case "diskUsage":
        return { title: "磁盘使用", description: "管理存储空间" };
      case "dataImport":
        return { title: "数据导入", description: "导入外部数据" };
      case "status":
        return { title: "系统状态", description: "查看系统状态" };
      default:
        return { title: "", description: "" };
    }
  };

  const { title, description } = getSectionInfo(activeSection);

  const handleBackToHome = () => {
    if (onNavigate) {
      onNavigate("home");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex h-full">
        {/* 侧边栏 */}
        <div className="w-56 border-r bg-gray-50 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索设置..."
                  className="pl-9 rounded-lg border-gray-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(groupedSections).map(([category, sections]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-500 mb-2 px-2">
                    {category}
                  </h3>
                  <div className="space-y-1">
                    {sections.map((section) => (
                      <Button
                        key={section.id}
                        variant={activeSection === section.id ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start rounded-lg",
                          activeSection === section.id
                            ? "bg-white text-blue-600 shadow-sm"
                            : "hover:bg-white"
                        )}
                        onClick={() => setActiveSection(section.id as SettingsSection)}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center mr-2",
                          activeSection === section.id
                            ? "bg-blue-50"
                            : "bg-gray-100"
                        )}>
                          {section.icon}
                        </div>
                        <span>{section.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 登出按钮固定在底部 */}
          <div className="p-4 border-t bg-gray-50">
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg w-full"
              onClick={() => {
                updateSettings({ authToken: "", user: undefined });
                if (onNavigate) {
                  onNavigate("home");
                }
                router.push("/login");
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              退出登录
            </Button>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col h-full">
          <div className="flex justify-between items-center border-b p-4 bg-white flex-shrink-0">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToHome}
              className="rounded-full h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">返回</span>
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {renderActiveSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

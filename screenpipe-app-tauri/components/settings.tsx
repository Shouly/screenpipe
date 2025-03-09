"use client";

import { useSettings } from "@/lib/hooks/use-settings";
import { useSettingsDialog } from "@/lib/hooks/use-settings-dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
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
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { Input } from "./ui/input";
import HealthStatus from "./screenpipe-status";
import { useStatusDialog } from "@/lib/hooks/use-status-dialog";

type SettingsSection =
  | "general"
  | "ai"
  | "shortcuts"
  | "recording"
  | "account"
  | "diskUsage"
  | "dataImport"
  | "status";

export function Settings() {
  const { isOpen, setIsOpen: setSettingsOpen } = useSettingsDialog();
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [searchQuery, setSearchQuery] = useState("");
  const { settings, updateSettings } = useSettings();
  const { open: openStatusDialog } = useStatusDialog();
  const router = useRouter();

  const settingsSections = [
    {
      id: "account",
      label: "账户",
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
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">系统状态</h2>
            <p className="text-sm text-muted-foreground mb-4">
              查看系统各组件的运行状态和诊断信息。
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                openStatusDialog();
                setSettingsOpen(false);
              }}
              className="mb-6"
            >
              打开详细状态面板
            </Button>
            <div className="mt-4 border rounded-lg p-4">
              <HealthStatus />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // 获取当前部分的标题和描述
  const getSectionInfo = (section: SettingsSection) => {
    switch (section) {
      case "account":
        return { title: "账户", description: "管理您的账户信息" };
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

  return (
    <Dialog open={isOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-w-5xl p-0 h-[85vh] overflow-hidden">
        <div className="flex h-full">
          {/* 侧边栏 */}
          <div className="w-64 border-r p-4 h-full overflow-y-auto">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索设置..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(groupedSections).map(([category, sections]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    {category}
                  </h3>
                  <div className="space-y-1">
                    {sections.map((section) => (
                      <Button
                        key={section.id}
                        variant={activeSection === section.id ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          activeSection === section.id
                            ? "bg-accent text-accent-foreground"
                            : ""
                        )}
                        onClick={() => setActiveSection(section.id as SettingsSection)}
                      >
                        {section.icon}
                        <span className="ml-2">{section.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute bottom-4 left-4">
              <Button
                variant="ghost"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 p-2"
                onClick={() => {
                  updateSettings({ authToken: "", user: undefined });
                  setSettingsOpen(false);
                  router.push("/login");
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
              </Button>
            </div>
          </div>

          {/* 主内容区域 */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex justify-between items-center border-b p-4">
              <div>
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">关闭</span>
              </Button>
            </div>

            <div className="p-4">{renderActiveSection()}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

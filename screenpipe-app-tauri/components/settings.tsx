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
  ChevronLeft
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
import { motion, AnimatePresence } from "framer-motion";

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

  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

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
    const content = (() => {
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
    })();

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
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
    <motion.div 
      className="h-full flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex h-full">
        {/* 侧边栏 */}
        <motion.div 
          className="w-64 border-r border-gray-100 bg-white flex flex-col h-full shadow-sm"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex-1 overflow-y-auto p-6">
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索设置..."
                  className="pl-9 rounded-lg border-gray-200 bg-gray-50 focus-visible:ring-primary/20 focus-visible:ring-offset-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>

            <motion.div 
              className="space-y-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {Object.entries(groupedSections).map(([category, sections], categoryIndex) => (
                <motion.div 
                  key={category}
                  variants={itemVariants}
                  transition={{ delay: categoryIndex * 0.1 }}
                  className="pb-2"
                >
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-2">
                    {category}
                  </h3>
                  <div className="space-y-1">
                    {sections.map((section, sectionIndex) => (
                      <motion.div
                        key={section.id}
                        variants={itemVariants}
                        transition={{ delay: (categoryIndex * 0.1) + (sectionIndex * 0.05) }}
                      >
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start rounded-lg py-2.5 px-3 text-sm font-medium",
                            activeSection === section.id
                              ? "bg-primary/10 text-primary"
                              : "text-gray-700 hover:bg-gray-100"
                          )}
                          onClick={() => setActiveSection(section.id as SettingsSection)}
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center mr-3",
                            activeSection === section.id
                              ? "bg-primary/20 text-primary"
                              : "bg-gray-100 text-gray-500"
                          )}>
                            {section.icon}
                          </div>
                          <span>{section.label}</span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* 登出按钮固定在底部 */}
          <motion.div 
            className="p-6 border-t border-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <Button
              variant="outline"
              className="w-full justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100"
              onClick={() => {
                updateSettings({ authToken: "", user: undefined });
                if (onNavigate) {
                  onNavigate("home");
                }
                router.push("/login");
              }}
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          </motion.div>
        </motion.div>

        {/* 主内容区域 */}
        <motion.div 
          className="flex-1 flex flex-col h-full bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <motion.div 
            className="flex justify-between items-center border-b border-gray-100 p-6 bg-white flex-shrink-0"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToHome}
                className="mr-4 rounded-full h-8 w-8 p-0 hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5 text-gray-500" />
                <span className="sr-only">返回</span>
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="flex-1 overflow-y-auto bg-gray-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <div className="p-8 max-w-4xl mx-auto">
              {renderActiveSection()}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

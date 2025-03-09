"use client";

import { useSettings } from "@/lib/hooks/use-settings";
import { useSettingsDialog } from "@/lib/hooks/use-settings-dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
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

type SettingsSection =
  | "general"
  | "ai"
  | "shortcuts"
  | "recording"
  | "account"
  | "diskUsage"
  | "dataImport";

export function Settings() {
  const { isOpen, setIsOpen: setSettingsOpen } = useSettingsDialog();
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [searchQuery, setSearchQuery] = useState("");
  const { settings, updateSettings } = useSettings();
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

  const filteredSections = searchQuery
    ? settingsSections.filter((section) =>
      section.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : settingsSections;

  // 按类别分组
  const groupedSections = filteredSections.reduce((acc, section) => {
    if (!acc[section.category]) {
      acc[section.category] = [];
    }
    acc[section.category].push(section);
    return acc;
  }, {} as Record<string, typeof settingsSections>);

  const renderSection = () => {
    switch (activeSection) {
      case "general":
        return <GeneralSettings />;
      case "ai":
        return <AISection />;
      case "account":
        return <AccountSection />;
      case "recording":
        return <RecordingSettings />;
      case "shortcuts":
        return <ShortcutSection />;
      case "diskUsage":
        return <DiskUsage />;
      case "dataImport":
        return <DataImportSection />;
    }
  };

  // 获取当前活动部分的标题和描述
  const getActiveSectionInfo = () => {
    switch (activeSection) {
      case "account":
        return { title: "账户信息", description: "查看您的账户信息" };
      case "general":
        return { title: "通用设置", description: "管理应用的基本设置" };
      case "ai":
        return { title: "AI 设置", description: "配置AI相关功能" };
      case "recording":
        return { title: "录制设置", description: "管理屏幕录制选项" };
      case "shortcuts":
        return { title: "快捷键", description: "自定义应用快捷键" };
      case "diskUsage":
        return { title: "磁盘使用", description: "管理应用存储空间" };
      case "dataImport":
        return { title: "数据导入", description: "导入外部数据" };
      default:
        return { title: "", description: "" };
    }
  };

  // 登出功能
  const handleLogout = () => {
    updateSettings({
      user: {
        id: "",
        email: "",
        name: ""
      },
      authToken: ""
    });
    setSettingsOpen(false);
    router.push("/login");
  };

  const activeSectionInfo = getActiveSectionInfo();

  return (
    <Dialog modal={true} open={isOpen} onOpenChange={setSettingsOpen}>
      <DialogContent
        className="max-w-[80vw] w-full max-h-[80vh] h-full overflow-hidden p-0 [&>button]:hidden rounded-xl border-none shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          className="flex h-full bg-background"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* 侧边栏 */}
          <div className="w-52 border-r bg-muted/30 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">设置</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setSettingsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* 搜索框 */}
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索设置..."
                  className="pl-8 h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* 设置导航 */}
            <div className="flex-1 overflow-y-auto">
              {Object.entries(groupedSections).map(([category, sections]) => (
                <div key={category} className="mb-4">
                  <h3 className="text-xs font-medium text-muted-foreground px-4 py-2">{category}</h3>
                  <div>
                    {sections.map((section) => (
                      <motion.button
                        key={section.id}
                        onClick={() => setActiveSection(section.id as SettingsSection)}
                        className={cn(
                          "flex items-center w-full px-4 py-2 text-sm transition-colors",
                          activeSection === section.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted"
                        )}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="flex items-center justify-center w-5 h-5 mr-3">
                          {section.icon}
                        </span>
                        <span>{section.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 登出按钮 */}
            {settings.user?.id && (
              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>登出</span>
                </Button>
              </div>
            )}
          </div>

          {/* 内容区域 */}
          <motion.div
            className="flex-1 flex flex-col h-full max-h-[80vh] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            key={activeSection}
          >
            {/* 内容标题 */}
            <div className="border-b p-6 pb-4">
              <h3 className="text-lg font-medium">{activeSectionInfo.title}</h3>
              <p className="text-sm text-muted-foreground">{activeSectionInfo.description}</p>
            </div>

            {/* 内容主体 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl">
                {renderSection()}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

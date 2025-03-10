"use client";

import React from "react";
import { useSettings } from "@/lib/hooks/use-settings";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function GeneralSettings() {
  const { settings, updateSettings } = useSettings();

  const handleSettingsChange = (newSettings: Partial<typeof settings>) => {
    updateSettings(newSettings);
  };

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
    hidden: { y: 10, opacity: 0 },
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

  return (
    <motion.div 
      className="w-full space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium text-gray-800">启用自动启动</h4>
                <p className="text-sm text-gray-500">
                  在系统启动时自动启动 ScreenPipe
                </p>
              </div>
              <Switch
                id="auto-start-toggle"
                checked={settings.autoStartEnabled}
                onCheckedChange={(checked) =>
                  handleSettingsChange({ autoStartEnabled: checked })
                }
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium text-gray-800">开发者模式</h4>
                <p className="text-sm text-gray-500">
                  启用高级功能和调试选项
                </p>
              </div>
              <Switch
                id="dev-mode-toggle"
                checked={settings.devMode}
                onCheckedChange={(checked) =>
                  handleSettingsChange({ devMode: checked })
                }
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium text-gray-800">自动检查更新</h4>
                <p className="text-sm text-gray-500">
                  定期检查 ScreenPipe 的新版本
                </p>
              </div>
              <Switch
                id="auto-update-toggle"
                checked={true}
                onCheckedChange={(checked) => {
                  // 这里可以添加自动更新的逻辑
                  console.log("Auto update setting changed:", checked);
                }}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

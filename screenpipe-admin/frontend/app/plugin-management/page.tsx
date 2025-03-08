"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { PluginList } from "@/components/plugin-management/plugin-list";

export default function PluginManagementPage() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">插件管理</h1>
        <p className="text-muted-foreground">
          管理和发布应用插件，上传新版本并跟踪下载统计
        </p>
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>提示</AlertTitle>
        <AlertDescription>
          插件管理系统允许您创建、发布和管理应用插件。您可以上传新版本、查看下载统计，并管理插件的可见性和状态。
        </AlertDescription>
      </Alert>

      <PluginList />
    </div>
  );
} 
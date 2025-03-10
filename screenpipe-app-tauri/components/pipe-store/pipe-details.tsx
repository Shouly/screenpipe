import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Power,
  Puzzle,
  RefreshCw,
  Trash2,
  X,
  Download,
  Loader2,
  Settings,
  UserIcon,
} from "lucide-react";
import { PipeStoreMarkdown } from "@/components/pipe-store-markdown";
import { PipeWithStatus } from "./types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { LogFileButton } from "../log-file-button";
import { toast } from "../ui/use-toast";
import { invoke } from "@tauri-apps/api/core";
import { PipeConfigForm } from "../pipe-config-form";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import { Badge } from "../ui/badge";
import { getBuildStatus } from "./pipe-card";

interface PipeDetailsProps {
  pipe: PipeWithStatus;
  onClose: () => void;
  onToggle: (pipe: PipeWithStatus, onComplete: () => void) => void;
  onConfigSave: (config: Record<string, any>, onComplete: () => void) => void;
  onUpdate: (pipe: PipeWithStatus, onComplete: () => void) => void;
  onDelete: (pipe: PipeWithStatus, onComplete: () => void) => void;
  onRefreshFromDisk: (pipe: PipeWithStatus, onComplete: () => void) => void;
  onInstall: (pipe: PipeWithStatus, onComplete: () => void) => void;
  isLoadingInstall?: boolean;
}

const buildStatusNotAllows = ["in_progress", "not_started"];

const isValidSource = (source?: string): boolean => {
  if (!source) return false;

  // github url pattern
  const githubPattern = /^https?:\/\/(?:www\.)?github\.com\/.+\/.+/i;

  // filesystem path patterns (unix and windows)
  const unixPattern = /^(?:\/|~\/)/;
  const windowsPattern = /^[a-zA-Z]:\\|^\\\\/;

  return (
    githubPattern.test(source) ||
    unixPattern.test(source) ||
    windowsPattern.test(source)
  );
};

export const PipeDetails: React.FC<PipeDetailsProps> = ({
  pipe,
  onClose,
  onToggle,
  onConfigSave,
  onUpdate,
  onDelete,
  onRefreshFromDisk,
  onInstall,
  isLoadingInstall,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <div className="fixed top-0 right-0 bottom-0 left-16 bg-background transform transition-transform duration-200 ease-in-out flex flex-col z-20">
      <div className="flex items-center justify-between p-4 border-b bg-muted/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-muted rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{pipe.name}</h2>
            <Badge variant={"outline"} className="font-mono text-xs bg-muted/50 border-0 px-2 py-1">
              by {pipe.developer_accounts.developer_name}
            </Badge>
            {pipe.has_update && (
              <Badge
                variant="default"
                className="bg-primary text-white text-xs animate-pulse"
              >
                更新可用
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {pipe.is_installed && (
          <div className="w-[320px] border-r bg-muted/5 flex-shrink-0 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex flex-col gap-3 w-full">
                  <h3 className="text-sm font-medium text-primary flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Power className="h-3 w-3 text-primary" />
                    </div>
                    插件操作
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => {
                              setIsLoading(true);
                              onToggle(pipe, () => setIsLoading(false));
                            }}
                            variant={
                              pipe.installed_config?.enabled
                                ? "default"
                                : "outline"
                            }
                            size="icon"
                            className="h-9 w-9 rounded-lg shadow-sm"
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {pipe.installed_config?.enabled
                              ? "禁用"
                              : "启用"}{" "}
                            插件
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <LogFileButton className="text-xs rounded-lg shadow-sm h-9 w-9" />

                    {pipe.installed_config?.source &&
                    isValidSource(pipe.installed_config.source) ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() =>
                                onRefreshFromDisk(pipe, () =>
                                  setIsLoading(false)
                                )
                              }
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-lg shadow-sm"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>从本地磁盘刷新代码</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => {
                                onUpdate(pipe, () => setIsLoading(false));
                              }}
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-lg shadow-sm"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {pipe.has_update ? (
                              <p>更新可用！点击更新插件</p>
                            ) : (
                              <p>检查更新</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    <div className="flex items-center gap-2">
                      {/* Only show delete button for non-core pipes */}
                      {!pipe.is_core_pipe && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => {
                                  onDelete(pipe, () => setIsLoading(false));
                                }}
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-lg shadow-sm hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>删除插件</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {pipe.installed_config?.enabled && (
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-medium text-primary flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Settings className="h-3 w-3 text-primary" />
                    </div>
                    插件配置
                  </h3>
                  <PipeConfigForm
                    pipe={pipe}
                    onConfigSave={(config) => {
                      onConfigSave(config, () => setIsLoading(false));
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-muted/5">
          <div className="max-w-3xl mx-auto p-8">
            {!pipe.is_installed && (
              <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-accent/20">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Download className="h-4 w-4 text-primary" />
                  </div>
                  获取此插件
                </h3>
                <Button
                  size="default"
                  variant={pipe.is_paid ? "default" : "outline"}
                  onClick={() => {
                    setIsLoading(true);
                    onInstall(pipe, () => setIsLoading(false));
                  }}
                  className="font-medium rounded-lg shadow-sm"
                  disabled={isLoadingInstall}
                >
                  {isLoadingInstall ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      正在安装...
                    </>
                  ) : pipe.is_paid ? (
                    `$${pipe.price}`
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 mr-2" />
                      获取
                    </>
                  )}
                </Button>
              </div>
            )}

            {pipe.installed_config?.enabled &&
              !buildStatusNotAllows.includes(
                getBuildStatus(pipe.installed_config.buildStatus) ?? ""
              ) &&
              pipe.installed_config?.port && (
                <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-accent/20">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Puzzle className="h-4 w-4 text-primary" />
                    </div>
                    打开插件
                  </h3>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() =>
                        openUrl(
                          `http://localhost:${pipe.installed_config?.port}`
                        )
                      }
                      disabled={!pipe.installed_config?.enabled}
                      className="rounded-lg shadow-sm"
                    >
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      在浏览器中打开
                    </Button>
                    <Button
                      variant="default"
                      onClick={async () => {
                        try {
                          await invoke("open_pipe_window", {
                            port: pipe.installed_config!.port,
                            title: pipe.name,
                          });
                        } catch (err) {
                          console.error("failed to open pipe window:", err);
                          toast({
                            title: "error opening pipe window",
                            description: "please try again or check the logs",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={!pipe.installed_config.enabled}
                      className="rounded-lg shadow-sm"
                    >
                      <Puzzle className="mr-2 h-3.5 w-3.5" />
                      作为应用打开
                    </Button>
                  </div>
                </div>
              )}

            {pipe.description && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-accent/20">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Puzzle className="h-4 w-4 text-primary" />
                  </div>
                  关于此插件
                </h3>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <PipeStoreMarkdown content={pipe.description} />
                </div>
              </div>
            )}
            
            {/* 插件信息卡片 */}
            <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-accent/20">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-primary" />
                </div>
                插件信息
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">开发者</p>
                  <p className="font-medium">{pipe.developer_accounts.developer_name}</p>
                </div>
                {pipe.plugin_analytics.downloads_count != null && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">下载次数</p>
                    <p className="font-medium flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5 text-muted-foreground" />
                      {pipe.plugin_analytics.downloads_count}
                    </p>
                  </div>
                )}
                {pipe.installed_config?.version && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">版本</p>
                    <p className="font-medium font-mono">v{pipe.installed_config.version}</p>
                  </div>
                )}
                {pipe.source_code && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">源代码</p>
                    <a
                      href={pipe.source_code}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline flex items-center gap-1.5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      查看源码
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

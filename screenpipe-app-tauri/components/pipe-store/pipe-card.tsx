import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Puzzle,
  UserIcon,
  Loader2,
  Power,
  ArrowUpCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { PipeStoreMarkdown } from "@/components/pipe-store-markdown";
import { BuildStatus, PipeWithStatus } from "./types";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { useSettings } from "@/lib/hooks/use-settings";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { open as openUrl } from "@tauri-apps/plugin-shell";

interface PipeCardProps {
  pipe: PipeWithStatus;
  onInstall: (pipe: PipeWithStatus, onComplete: () => void) => Promise<any>;
  onClick: (pipe: PipeWithStatus) => void;
  isLoadingInstall?: boolean;
  onToggle: (pipe: PipeWithStatus, onComplete: () => void) => Promise<any>;
  setPipe: (pipe: PipeWithStatus) => void;
}

export function getBuildStatus(status: BuildStatus | undefined): string {
  return typeof status === "object" ? status.status : status || "";
}

function getBuildStepMessage(buildStatus: BuildStatus | undefined): string {
  if (typeof buildStatus !== "object") return "building...";

  const { step, status } = buildStatus;
  if (status === "not_started") {
    return "waiting to start...";
  }

  switch (step) {
    case "downloading":
      return "downloading files...";
    case "extracting":
      return "extracting files...";
    case "installing":
      return "installing dependencies...";
    case "completed":
      return "completed installation";
    case "building":
      return "building application...";
    default:
      return step || "processing...";
  }
}

function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/<\/?[^>]+(>|$)/g, "") // Remove HTML tags
    .replace(/\*\*(.*?)\*\*|__(.*?)__/g, "$1$2") // Bold
    .replace(/\*(.*?)\*|_(.*?)_/g, "$1$2") // Italic
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1") // Links
    .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, "$1") // Images
    .replace(/#{1,6}\s+/g, "") // Headers
    .replace(/`{1,3}(.*?)`{1,3}/gs, "$1") // Code blocks
    .replace(/^\s*>[>\s]*/gm, "") // Blockquotes
    .replace(/^\s*[-*+]\s+/gm, "") // Unordered lists
    .replace(/^\s*\d+\.\s+/gm, "") // Ordered lists
    .replace(/~~(.*?)~~/g, "$1"); // Strikethrough
}

export const PipeCard: React.FC<PipeCardProps> = ({
  pipe,
  onInstall,
  onClick,
  setPipe,
  isLoadingInstall,
  onToggle,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useSettings();

  const handleOpenWindow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (pipe.installed_config?.port) {
        await invoke("open_pipe_window", {
          port: pipe.installed_config.port,
          title: pipe.name,
        });
      }
    } catch (err) {
      console.error("failed to open pipe window:", err);
      toast({
        title: "error opening pipe window",
        description: "please try again or check the logs",
        variant: "destructive",
      });
    }
  };

  const handleOpenInBrowser = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (pipe.installed_config?.port) {
        await openUrl(`http://localhost:${pipe.installed_config.port}`);
      }
    } catch (err) {
      console.error("failed to open in browser:", err);
      toast({
        title: "error opening in browser",
        description: "please try again or check the logs",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const pollBuildStatus = async () => {
      const id = pipe.is_local ? pipe.id : pipe.name;
      try {
        const response = await fetch(
          `http://localhost:3030/pipes/build-status/${id}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data, pipe.installed_config?.buildStatus);
        if (
          data.buildStatus.length > 0 &&
          JSON.stringify(data.buildStatus) !==
            JSON.stringify(pipe.installed_config?.buildStatus)
        ) {
          setPipe({
            ...pipe,
            installed_config: {
              ...pipe.installed_config,
              is_nextjs: pipe.installed_config?.is_nextjs ?? false,
              source: pipe.installed_config?.source ?? "",
              buildStatus: data.buildStatus as BuildStatus,
            },
          });
        }
      } catch (error) {
        console.error("Error polling build status:", error);
        setPipe({
          ...pipe,
          installed_config: {
            ...pipe.installed_config,
            is_nextjs: pipe.installed_config?.is_nextjs ?? false,
            source: pipe.installed_config?.source ?? "",
            buildStatus: {
              status: "error",
              step: "failed",
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred",
            } as BuildStatus,
          },
        });
      }
    };

    let buildStatusInterval: NodeJS.Timeout | null = null;
    const buildStatus = pipe.installed_config?.buildStatus;
    const isInProgress =
      buildStatus === "in_progress" ||
      (typeof buildStatus === "object" && buildStatus.status === "in_progress");

    if (isInProgress) {
      buildStatusInterval = setInterval(pollBuildStatus, 3000);
    }

    return () => {
      if (buildStatusInterval) {
        clearInterval(buildStatusInterval);
      }
    };
  }, [pipe.installed_config?.buildStatus]);

  const renderInstallationStatus = useCallback(() => {
    const buildStatus = pipe.installed_config?.buildStatus;
    const status = getBuildStatus(buildStatus);

    if (status === "not_started" || status === "in_progress") {
      return (
        <Button
          size="sm"
          variant="outline"
          disabled
          className="hover:bg-muted font-medium relative hover:!bg-muted no-card-hover rounded-lg h-8 px-2.5 flex-1 border-border/50 transition-colors"
        >
          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
          <span className="text-xs">{getBuildStepMessage(buildStatus)}</span>
        </Button>
      );
    }

    if (status === "error") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLoading(true);
                  onToggle(pipe, () => setIsLoading(false));
                }}
                className="font-medium no-card-hover rounded-lg h-8 px-2.5 flex-1 transition-colors"
                disabled={isLoading}
              >
                <AlertCircle className="h-3 w-3 mr-1.5" />
                <span className="text-xs">重试</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {typeof buildStatus === "object" && buildStatus.error
                ? buildStatus.error
                : "安装失败"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (!pipe.is_enabled && buildStatus === "success") {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            setIsLoading(true);
            onToggle(pipe, () => setIsLoading(false));
          }}
          className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-medium relative transition-colors no-card-hover rounded-lg h-8 px-2.5 flex-1 border-border/50"
          disabled={isLoading}
        >
          <Power className="h-3 w-3 mr-1.5" />
          <span className="text-xs">启用</span>
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          handleOpenInBrowser(e);
        }}
        className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-medium relative transition-colors no-card-hover rounded-lg h-8 px-2.5 flex-1 border-border/50"
      >
        <Puzzle className="h-3 w-3 mr-1.5" />
        <span className="text-xs">在浏览器中打开</span>
      </Button>
    );
  }, [pipe.installed_config?.buildStatus, isLoading, onToggle, pipe, handleOpenWindow, handleOpenInBrowser]);

  return (
    <motion.div
      className="group border border-border/50 rounded-xl p-4 hover:bg-accent/5 transition-all duration-300 cursor-pointer relative shadow-sm hover:shadow-md h-full flex flex-col"
      onClick={() => onClick(pipe)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      {/* 状态指示器 */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {pipe.is_installed && (
          <div className={cn(
            "w-2 h-2 rounded-full",
            pipe.is_enabled ? "bg-green-500" : "bg-amber-500"
          )} />
        )}
        
        {pipe.has_update && (
          <div className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center">
            <ArrowUpCircle className="h-2.5 w-2.5 mr-0.5" />
            更新
          </div>
        )}
      </div>

      <div className="flex flex-col h-full justify-between">
        {/* 头部信息 */}
        <div className="mb-auto">
          <div className="flex items-start gap-3 mb-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Puzzle className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base tracking-tight truncate cn-text-title">
                {pipe.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserIcon className="h-3 w-3" />
                <span className="truncate">{pipe.developer_accounts.developer_name}</span>
                
                {pipe.plugin_analytics.downloads_count != null && (
                  <div className="flex items-center gap-1 ml-2">
                    <Download className="h-2.5 w-2.5" />
                    <span>{pipe.plugin_analytics.downloads_count}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 描述 */}
          <div className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem] mb-2.5 cn-text-body">
            <PipeStoreMarkdown
              content={
                (pipe.description
                  ? stripMarkdown(pipe.description).substring(0, 80)
                  : "") + "..."
              }
              variant="compact"
            />
          </div>
          
          {/* 标签 */}
          <div className="flex flex-wrap gap-1.5">
            {pipe.installed_config?.version && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted/30 font-mono text-xs">
                v{pipe.installed_config?.version}
              </span>
            )}
            {pipe.is_local && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary-foreground text-xs">
                本地
              </span>
            )}
            {pipe.source_code && (
              <a
                href={pipe.source_code}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted/30 text-xs hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                源码
              </a>
            )}
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          {pipe.is_installed ? (
            <div className="flex items-center gap-2 w-full">
              {renderInstallationStatus()}
              
              {/* 额外操作按钮 */}
              {pipe.is_enabled && pipe.installed_config?.buildStatus === "success" && (
                <div className="transition-opacity">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInBrowser(e);
                          }}
                          className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary"
                        >
                          <Puzzle className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>在独立窗口中打开</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              variant={pipe.is_paid ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                setIsLoading(true);
                onInstall(pipe, () => setIsLoading(false));
              }}
              className={cn(
                "font-medium no-card-hover rounded-lg h-8 w-full justify-center transition-colors",
                pipe.is_paid ? "" : "border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              )}
              disabled={isLoading || isLoadingInstall}
            >
              {isLoadingInstall ? (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Download className="h-3 w-3 mr-1.5" />
                  <span className="text-xs">{pipe.is_paid ? `$${pipe.price}` : "安装"}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

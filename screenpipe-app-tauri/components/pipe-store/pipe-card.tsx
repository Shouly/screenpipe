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
          className="hover:bg-muted font-medium relative hover:!bg-muted no-card-hover rounded-lg shadow-sm"
        >
          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
          <div className="flex flex-col items-start">
            <span>{getBuildStepMessage(buildStatus)}</span>
          </div>
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
                className="font-medium no-card-hover rounded-lg shadow-sm"
                disabled={isLoading}
              >
                <AlertCircle className="h-3.5 w-3.5 mr-2" />
                重试
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
          className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-medium relative transition-colors no-card-hover rounded-lg shadow-sm"
          disabled={isLoading}
        >
          <Power className="h-3.5 w-3.5 mr-2" />
          启用
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleOpenWindow}
        className="hover:bg-accent/20 font-medium relative no-card-hover rounded-lg shadow-sm transition-colors"
      >
        <Puzzle className="h-3.5 w-3.5 mr-2" />
        打开
      </Button>
    );
  }, [pipe.installed_config?.buildStatus]);

  return (
    <motion.div
      className="border rounded-xl p-5 hover:bg-accent/20 has-[.no-card-hover:hover]:hover:bg-transparent transition-all duration-300 cursor-pointer relative shadow-sm hover:shadow-md canva-hover-effect"
      onClick={() => onClick(pipe)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col h-full justify-between space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Puzzle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg tracking-tight">
                {pipe.name}
              </h3>
              <div className="text-sm text-muted-foreground">
                <PipeStoreMarkdown
                  content={
                    (pipe.description
                      ? stripMarkdown(pipe.description).substring(0, 90)
                      : "") + "..."
                  }
                  variant="compact"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 isolate">
            {pipe.is_installed ? (
              renderInstallationStatus()
            ) : (
              <Button
                size="sm"
                variant={pipe.is_paid ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLoading(true);
                  onInstall(pipe, () => setIsLoading(false));
                }}
                className="font-medium no-card-hover rounded-lg shadow-sm hover:shadow transition-all"
                disabled={isLoading || isLoadingInstall}
              >
                {isLoadingInstall ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5 mr-2" />
                    {pipe.is_paid ? `$${pipe.price}` : "安装"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        {pipe.developer_accounts.developer_name && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto flex-wrap">
            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
              <div className="size-5 rounded-full bg-muted flex items-center justify-center">
                <UserIcon className="size-3" />
              </div>
              <span className="font-medium">{pipe.developer_accounts.developer_name}</span>
            </div>
            {pipe.plugin_analytics.downloads_count != null && (
              <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                <Download className="h-3 w-3" />
                <span className="font-medium">{pipe.plugin_analytics.downloads_count}</span>
              </span>
            )}
            {pipe.source_code && (
              <a
                href={pipe.source_code}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 hover:bg-accent/20 hover:text-accent transition-colors no-card-hover"
              >
                <Download className="h-3 w-3" />
                <span className="font-mono font-medium">source</span>
              </a>
            )}
            {pipe.is_local && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/20 text-secondary-foreground font-medium text-xs">
                local
              </span>
            )}
            {pipe.installed_config?.version && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 font-mono text-xs font-medium">
                v{pipe.installed_config?.version}
              </span>
            )}
            {pipe.has_update && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary font-medium text-xs">
                <ArrowUpCircle className="h-3 w-3" />
                update
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

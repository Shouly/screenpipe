import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FolderOpen, Puzzle } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { PublishDialog } from "../publish-dialog";
import { PipeStorePlugin } from "@/lib/api/store";
import { motion } from "framer-motion";

interface AddPipeFormProps {
  onAddPipe: (url: string) => Promise<any>;
  onLoadFromLocalFolder: (setNewRepoUrl: (url: string) => void) => Promise<any>;
  isHealthy: boolean;
}

export const AddPipeForm: React.FC<AddPipeFormProps> = ({
  onAddPipe,
  onLoadFromLocalFolder,
  isHealthy,
}) => {
  const [newRepoUrl, setNewRepoUrl] = useState("");

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Puzzle className="h-4 w-4 text-primary" />
        </div>
        添加自定义 Pipe
      </h3>
      <div className="bg-accent/20 p-4 rounded-xl">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="url"
              placeholder={
                !isHealthy
                  ? "screenpipe 未运行..."
                  : "输入 GitHub 链接或本地路径"
              }
              value={newRepoUrl}
              onChange={(e) => setNewRepoUrl(e.target.value)}
              autoCorrect="off"
              autoComplete="off"
              disabled={!isHealthy}
              className="h-10 bg-white border-0 shadow-sm focus-visible:ring-primary"
            />
          </div>
          <Button
            onClick={() => onAddPipe(newRepoUrl)}
            disabled={!newRepoUrl || !isHealthy}
            size="icon"
            className="h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => onLoadFromLocalFolder(setNewRepoUrl)}
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-lg hover:bg-accent/20 shadow-sm transition-all"
            disabled={!isHealthy}
          >
            <FolderOpen className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground mt-3">
          <a
            href="https://docs.screenpi.pe/docs/plugins"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors flex items-center gap-1 group"
          >
            <Puzzle className="h-3 w-3 group-hover:text-primary transition-colors" />
            <span className="group-hover:underline">了解如何创建您自己的 Pipe</span>
          </a>
        </div>
      </div>
    </div>
  );
};

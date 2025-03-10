import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FolderOpen, Puzzle } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { PublishDialog } from "../publish-dialog";
import { PipeStorePlugin } from "@/lib/api/store";

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
        <Puzzle className="h-4 w-4 text-primary" />
        添加自定义 Pipe
      </h3>
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
            className="h-10"
          />
        </div>
        <Button
          onClick={() => onAddPipe(newRepoUrl)}
          disabled={!newRepoUrl || !isHealthy}
          size="icon"
          className="h-10 w-10"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => onLoadFromLocalFolder(setNewRepoUrl)}
          variant="outline"
          size="icon"
          className="h-10 w-10"
          disabled={!isHealthy}
        >
          <FolderOpen className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-sm text-muted-foreground">
        <a
          href="https://docs.screenpi.pe/docs/plugins"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors flex items-center gap-1"
        >
          <Puzzle className="h-3 w-3" />
          了解如何创建您自己的 Pipe
        </a>
      </div>
    </div>
  );
};

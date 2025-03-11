import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FolderOpen, Puzzle } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { PublishDialog } from "../publish-dialog";
import { PipeStorePlugin } from "@/lib/api/store";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface AddPipeFormProps {
  onAddPipe: (url: string) => Promise<any>;
  onLoadFromLocalFolder: (setNewRepoUrl: (url: string) => void) => Promise<any>;
  isHealthy: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddPipeForm: React.FC<AddPipeFormProps> = ({
  onAddPipe,
  onLoadFromLocalFolder,
  isHealthy,
  isOpen,
  onOpenChange,
}) => {
  const [newRepoUrl, setNewRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPipe = async () => {
    if (!newRepoUrl || !isHealthy) return;
    
    setIsLoading(true);
    try {
      await onAddPipe(newRepoUrl);
      setNewRepoUrl("");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadFromFolder = async () => {
    if (!isHealthy) return;
    
    setIsLoading(true);
    try {
      await onLoadFromLocalFolder(setNewRepoUrl);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Puzzle className="h-4 w-4 text-primary" />
            </div>
            添加自定义 Pipe
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            输入 GitHub 链接或选择本地文件夹来添加自定义 Pipe
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
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
                disabled={!isHealthy || isLoading}
                className="h-10 border-border focus-visible:ring-primary"
              />
            </div>
            <Button
              onClick={handleLoadFromFolder}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-lg hover:bg-accent/20 transition-all"
              disabled={!isHealthy || isLoading}
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground mt-4">
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
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg"
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            onClick={handleAddPipe}
            disabled={!newRepoUrl || !isHealthy || isLoading}
            className="rounded-lg bg-primary hover:bg-primary/90 transition-all"
          >
            {isLoading ? (
              <>
                <span className="mr-2">添加中...</span>
                <span className="animate-spin">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                添加 Pipe
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

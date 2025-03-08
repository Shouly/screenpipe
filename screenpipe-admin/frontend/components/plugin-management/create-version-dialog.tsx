"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Plugin, PluginVersion, createPluginVersion } from "../../lib/plugin-api";

interface CreateVersionFormData {
  version: string;
  changelog: string;
  min_app_version: string;
  dependencies: string;
  zip_file: File | null;
}

interface CreateVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plugin: Plugin;
  onVersionCreated: (version: PluginVersion) => void;
}

export function CreateVersionDialog({ 
  open, 
  onOpenChange, 
  plugin, 
  onVersionCreated 
}: CreateVersionDialogProps) {
  const [formData, setFormData] = useState<CreateVersionFormData>({
    version: "",
    changelog: "",
    min_app_version: "",
    dependencies: "",
    zip_file: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.zip_file) {
      toast.error("请选择ZIP文件");
      return;
    }
    
    setIsSubmitting(true);

    try {
      let dependencies: Record<string, string> | undefined = undefined;
      
      if (formData.dependencies) {
        try {
          dependencies = JSON.parse(formData.dependencies);
        } catch {
          toast.error("依赖项格式不正确，请使用有效的JSON格式");
          setIsSubmitting(false);
          return;
        }
      }

      const newVersion = await createPluginVersion(plugin.id, {
        version: formData.version,
        changelog: formData.changelog || undefined,
        min_app_version: formData.min_app_version || undefined,
        dependencies,
        zip_file: formData.zip_file,
      });

      onVersionCreated(newVersion);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("上传版本错误:", error);
      toast.error("上传版本失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      version: "",
      changelog: "",
      min_app_version: "",
      dependencies: "",
      zip_file: null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>上传新版本</DialogTitle>
          <DialogDescription>
            为插件 &quot;{plugin.name}&quot; 上传新版本。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="version" className="text-right">
                版本号
              </Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    version: e.target.value,
                  })
                }
                placeholder="例如：1.0.0"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="changelog" className="text-right">
                更新日志
              </Label>
              <Textarea
                id="changelog"
                value={formData.changelog}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({
                    ...formData,
                    changelog: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="min_app_version" className="text-right">
                最低应用版本
              </Label>
              <Input
                id="min_app_version"
                value={formData.min_app_version}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    min_app_version: e.target.value,
                  })
                }
                placeholder="例如：1.0.0"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dependencies" className="text-right">
                依赖项
              </Label>
              <Textarea
                id="dependencies"
                value={formData.dependencies}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({
                    ...formData,
                    dependencies: e.target.value,
                  })
                }
                placeholder='JSON格式，例如：{"other-plugin": "^1.0.0"}'
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="zip_file" className="text-right">
                ZIP文件
              </Label>
              <Input
                id="zip_file"
                type="file"
                accept=".zip"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    zip_file: e.target.files ? e.target.files[0] : null,
                  })
                }
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "上传中..." : "上传版本"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
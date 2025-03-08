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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Plugin, PluginStatus, PluginVisibility, createPlugin } from "../../lib/plugin-api";

interface CreatePluginFormData {
  name: string;
  description: string;
  tags: string;
  status: PluginStatus;
  visibility: PluginVisibility;
}

interface CreatePluginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPluginCreated: (plugin: Plugin) => void;
}

export function CreatePluginDialog({ open, onOpenChange, onPluginCreated }: CreatePluginDialogProps) {
  const [formData, setFormData] = useState<CreatePluginFormData>({
    name: "",
    description: "",
    tags: "",
    status: "active",
    visibility: "private",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const tagsArray = formData.tags
        ? formData.tags.split(",").map((tag) => tag.trim())
        : [];

      const newPlugin = await createPlugin({
        name: formData.name,
        description: formData.description || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        status: formData.status,
        visibility: formData.visibility,
      });

      onPluginCreated(newPlugin);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("创建插件错误:", error);
      toast.error("创建插件失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      tags: "",
      status: "active",
      visibility: "private",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>创建新插件</DialogTitle>
          <DialogDescription>
            填写以下信息创建一个新的插件。创建后，您可以上传插件版本。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                名称
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                描述
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right">
                标签
              </Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="用逗号分隔多个标签"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                状态
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: PluginStatus) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="col-span-3" id="status">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">活跃</SelectItem>
                  <SelectItem value="inactive">非活跃</SelectItem>
                  <SelectItem value="deprecated">已弃用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="visibility" className="text-right">
                可见性
              </Label>
              <Select
                value={formData.visibility}
                onValueChange={(value: PluginVisibility) =>
                  setFormData({ ...formData, visibility: value })
                }
              >
                <SelectTrigger className="col-span-3" id="visibility">
                  <SelectValue placeholder="选择可见性" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">公开</SelectItem>
                  <SelectItem value="private">私有</SelectItem>
                  <SelectItem value="organization">组织</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "创建中..." : "创建插件"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
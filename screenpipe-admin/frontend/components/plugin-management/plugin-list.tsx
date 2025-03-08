"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { 
  Plugin, 
  PluginVersion, 
  getPlugins, 
  deletePlugin, 
  deletePluginVersion 
} from "../../lib/plugin-api";
import { PluginCard } from "./plugin-card";
import { CreatePluginDialog } from "././create-plugin-dialog";
import { CreateVersionDialog } from "././create-version-dialog";

export function PluginList() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

  // 获取插件列表
  const fetchPlugins = async () => {
    setLoading(true);
    try {
      const data = await getPlugins();
      setPlugins(data);
    } catch (error) {
      console.error("获取插件列表错误:", error);
      toast.error("获取插件列表失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchPlugins();
  }, []);

  // 创建插件后的回调
  const handlePluginCreated = (newPlugin: Plugin) => {
    setPlugins([...plugins, newPlugin]);
    setCreateDialogOpen(false);
    toast.success(`插件 "${newPlugin.name}" 已成功创建`);
  };

  // 创建版本后的回调
  const handleVersionCreated = (pluginId: number, newVersion: PluginVersion) => {
    setPlugins(
      plugins.map((plugin) => {
        if (plugin.id === pluginId) {
          // 更新所有版本的is_latest状态
          const updatedVersions = plugin.versions.map((v: PluginVersion) => ({
            ...v,
            is_latest: false,
          }));
          
          return {
            ...plugin,
            versions: [newVersion, ...updatedVersions],
          };
        }
        return plugin;
      })
    );
    setVersionDialogOpen(false);
    toast.success(`版本 ${newVersion.version} 已成功上传`);
  };

  // 删除插件
  const handleDeletePlugin = async (plugin: Plugin) => {
    if (!confirm(`确定要删除插件 "${plugin.name}" 吗？此操作不可撤销。`)) {
      return;
    }

    try {
      await deletePlugin(plugin.id);
      setPlugins(plugins.filter((p) => p.id !== plugin.id));
      toast.success(`插件 "${plugin.name}" 已成功删除`);
    } catch (error) {
      console.error("删除插件错误:", error);
      toast.error("删除插件失败，请稍后重试");
    }
  };

  // 删除插件版本
  const handleDeleteVersion = async (plugin: Plugin, version: PluginVersion) => {
    if (!confirm(`确定要删除插件 "${plugin.name}" 的版本 ${version.version} 吗？此操作不可撤销。`)) {
      return;
    }

    try {
      await deletePluginVersion(plugin.id, version.id);
      
      // 更新插件列表
      setPlugins(
        plugins.map((p) => {
          if (p.id === plugin.id) {
            return {
              ...p,
              versions: p.versions.filter((v: PluginVersion) => v.id !== version.id),
            };
          }
          return p;
        })
      );

      toast.success(`版本 ${version.version} 已成功删除`);
    } catch (error) {
      console.error("删除版本错误:", error);
      toast.error("删除版本失败，请稍后重试");
    }
  };

  // 打开上传版本对话框
  const handleOpenVersionDialog = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setVersionDialogOpen(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">插件列表</h2>
        <div className="flex gap-2">
          <Button onClick={fetchPlugins} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            创建插件
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : plugins.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">暂无插件</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              创建第一个插件
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {plugins.map((plugin) => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              onDelete={handleDeletePlugin}
              onDeleteVersion={handleDeleteVersion}
              onUploadVersion={handleOpenVersionDialog}
            />
          ))}
        </div>
      )}

      {/* 创建插件对话框 */}
      <CreatePluginDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onPluginCreated={handlePluginCreated}
      />

      {/* 上传版本对话框 */}
      {selectedPlugin && (
        <CreateVersionDialog
          open={versionDialogOpen}
          onOpenChange={setVersionDialogOpen}
          plugin={selectedPlugin}
          onVersionCreated={(version) => handleVersionCreated(selectedPlugin.id, version)}
        />
      )}
    </>
  );
} 
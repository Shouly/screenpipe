"use client";

import { Card, CardContent, CardFooter } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Trash2, Upload, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Plugin, PluginVersion, getPluginDownloadUrl } from "../../lib/plugin-api";

interface PluginCardProps {
  plugin: Plugin;
  onDelete: (plugin: Plugin) => void;
  onDeleteVersion: (plugin: Plugin, version: PluginVersion) => void;
  onUploadVersion: (plugin: Plugin) => void;
}

export function PluginCard({ plugin, onDelete, onDeleteVersion, onUploadVersion }: PluginCardProps) {
  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  // 渲染插件状态徽章
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">活跃</Badge>;
      case "inactive":
        return <Badge className="bg-gray-500">非活跃</Badge>;
      case "deprecated":
        return <Badge className="bg-red-500">已弃用</Badge>;
      default:
        return null;
    }
  };

  // 渲染插件可见性徽章
  const renderVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <Badge className="bg-blue-500">公开</Badge>;
      case "private":
        return <Badge className="bg-yellow-500">私有</Badge>;
      case "organization":
        return <Badge className="bg-purple-500">组织</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold">{plugin.name}</h3>
            <p className="text-muted-foreground">{plugin.description}</p>
          </div>
          <div className="flex gap-2">
            {renderStatusBadge(plugin.status)}
            {renderVisibilityBadge(plugin.visibility)}
          </div>
        </div>

        <Tabs defaultValue="versions">
          <TabsList>
            <TabsTrigger value="versions">版本</TabsTrigger>
            <TabsTrigger value="info">基本信息</TabsTrigger>
          </TabsList>
          <TabsContent value="versions" className="pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">版本历史</h3>
              <Button
                onClick={() => onUploadVersion(plugin)}
                size="sm"
              >
                <Upload className="mr-2 h-4 w-4" />
                上传新版本
              </Button>
            </div>
            {plugin.versions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                暂无版本，请上传第一个版本
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>版本</TableHead>
                    <TableHead>发布时间</TableHead>
                    <TableHead>文件大小</TableHead>
                    <TableHead>下载次数</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plugin.versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell>
                        {version.version}
                        {version.is_latest && (
                          <Badge className="ml-2 bg-green-500">最新</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(version.created_at), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </TableCell>
                      <TableCell>{formatFileSize(version.zip_size)}</TableCell>
                      <TableCell>{version.download_count}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a
                              href={getPluginDownloadUrl(plugin.id, version.version)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDeleteVersion(plugin, version)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          <TabsContent value="info" className="pt-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">标签</h4>
                <div className="flex flex-wrap gap-2">
                  {plugin.tags && plugin.tags.length > 0 ? (
                    plugin.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">无标签</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-1">创建时间</h4>
                <p>
                  {new Date(plugin.created_at).toLocaleString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">最后更新</h4>
                <p>
                  {new Date(plugin.updated_at).toLocaleString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">总下载次数</h4>
                <p>{plugin.downloads_count}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="px-6 py-4">
        <Button
          variant="destructive"
          onClick={() => onDelete(plugin)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          删除插件
        </Button>
      </CardFooter>
    </Card>
  );
} 
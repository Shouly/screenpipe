"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CommandResult, getCommandResults } from "@/lib/remote-control-api";

export function CommandHistory() {
  const [commandResults, setCommandResults] = useState<CommandResult[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取命令历史
  const fetchCommandHistory = async () => {
    setLoading(true);
    try {
      const response = await getCommandResults();
      setCommandResults(response.results || []);
    } catch (error) {
      console.error("获取命令历史错误:", error);
      toast.error("获取命令历史失败，请稍后重试");
      // 如果API不存在，使用模拟数据
      setCommandResults([
        {
          command_id: "cmd-001",
          success: true,
          message: "锁屏命令执行成功",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          client_id: "client-001",
        },
        {
          command_id: "cmd-002",
          success: false,
          message: "关机命令执行失败: 权限不足",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          client_id: "client-002",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchCommandHistory();
  }, []);

  // 格式化时间
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
    } catch (e) {
      return timeString;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">命令执行历史</h3>
        <Button variant="outline" size="sm" onClick={fetchCommandHistory} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          刷新
        </Button>
      </div>

      {commandResults.length === 0 && !loading ? (
        <div className="text-center py-8 text-muted-foreground">
          暂无命令执行历史
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>命令ID</TableHead>
                <TableHead>客户端ID</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>消息</TableHead>
                <TableHead>执行时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <span className="mt-2 block text-sm text-muted-foreground">加载中...</span>
                  </TableCell>
                </TableRow>
              ) : (
                commandResults.map((result) => (
                  <TableRow key={result.command_id}>
                    <TableCell className="font-medium">{result.command_id}</TableCell>
                    <TableCell>{result.client_id}</TableCell>
                    <TableCell>
                      {result.success ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          成功
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          失败
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={result.message}>
                      {result.message}
                    </TableCell>
                    <TableCell>{formatTime(result.timestamp)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
} 
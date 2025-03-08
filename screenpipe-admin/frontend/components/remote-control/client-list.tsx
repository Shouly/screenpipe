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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, LockIcon, PowerIcon, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ClientConnection, getClients, sendLockScreenCommand, sendShutdownCommand } from "@/lib/remote-control-api";

export function ClientList() {
  const [clients, setClients] = useState<ClientConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientConnection | null>(null);
  const [shutdownDelay, setShutdownDelay] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [commandLoading, setCommandLoading] = useState(false);

  // 获取客户端列表
  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await getClients();
      setClients(response.clients);
    } catch (error) {
      console.error("获取客户端列表错误:", error);
      toast.error("获取客户端列表失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 发送锁屏命令
  const handleLockScreen = async (clientId: string) => {
    setCommandLoading(true);
    try {
      const response = await sendLockScreenCommand(clientId);
      toast.success(`已向客户端 ${clientId} 发送锁屏命令`);
      return response.command_id;
    } catch (error) {
      console.error("发送锁屏命令错误:", error);
      toast.error("发送锁屏命令失败，请稍后重试");
      return null;
    } finally {
      setCommandLoading(false);
      setIsDialogOpen(false);
    }
  };

  // 发送关机命令
  const handleShutdown = async (clientId: string, delaySeconds: number) => {
    setCommandLoading(true);
    try {
      const response = await sendShutdownCommand(clientId, delaySeconds);
      toast.success(`已向客户端 ${clientId} 发送关机命令，延迟 ${delaySeconds} 秒`);
      return response.command_id;
    } catch (error) {
      console.error("发送关机命令错误:", error);
      toast.error("发送关机命令失败，请稍后重试");
      return null;
    } finally {
      setCommandLoading(false);
      setIsDialogOpen(false);
    }
  };

  // 初始加载和定时刷新
  useEffect(() => {
    fetchClients();
    
    // 每30秒刷新一次客户端列表
    const interval = setInterval(fetchClients, 30000);
    
    return () => clearInterval(interval);
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
        <h3 className="text-lg font-medium">已连接的客户端</h3>
        <Button variant="outline" size="sm" onClick={fetchClients} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          刷新
        </Button>
      </div>

      {clients.length === 0 && !loading ? (
        <div className="text-center py-8 text-muted-foreground">
          暂无连接的客户端
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客户端ID</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>连接时间</TableHead>
                <TableHead>最后心跳</TableHead>
                <TableHead className="text-right">操作</TableHead>
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
                clients.map((client) => (
                  <TableRow key={client.client_id}>
                    <TableCell className="font-medium">{client.client_id}</TableCell>
                    <TableCell>
                      {client.is_active ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          在线
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          离线
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatTime(client.connected_at)}</TableCell>
                    <TableCell>{formatTime(client.last_heartbeat)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedClient(client);
                            setIsDialogOpen(true);
                          }}
                          disabled={!client.is_active}
                        >
                          <LockIcon className="h-4 w-4 mr-1" />
                          锁屏
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={!client.is_active}
                            >
                              <PowerIcon className="h-4 w-4 mr-1" />
                              关机
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>确认关机</DialogTitle>
                              <DialogDescription>
                                您确定要关闭客户端 {client.client_id} 吗？
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Label htmlFor="delay">延迟时间（秒）</Label>
                              <Input
                                id="delay"
                                type="number"
                                min="0"
                                max="3600"
                                value={shutdownDelay}
                                onChange={(e) => setShutdownDelay(parseInt(e.target.value) || 0)}
                                className="mt-2"
                              />
                              <p className="text-sm text-muted-foreground mt-2">
                                设置延迟时间可以让用户有时间保存工作。
                              </p>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setShutdownDelay(0)}
                              >
                                取消
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleShutdown(client.client_id, shutdownDelay)}
                                disabled={commandLoading}
                              >
                                {commandLoading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    处理中
                                  </>
                                ) : (
                                  "确认关机"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 锁屏确认对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认锁屏</DialogTitle>
            <DialogDescription>
              您确定要锁定客户端 {selectedClient?.client_id} 的屏幕吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="default"
              onClick={() => selectedClient && handleLockScreen(selectedClient.client_id)}
              disabled={commandLoading}
            >
              {commandLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  处理中
                </>
              ) : (
                "确认锁屏"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
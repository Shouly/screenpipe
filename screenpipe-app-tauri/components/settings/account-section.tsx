"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useSettings } from "@/lib/hooks/use-settings";
import { Eye, EyeOff, Trash2, UserCog } from "lucide-react";
import { useState } from "react";
import { Card } from "../ui/card";

export function AccountSection() {
  const { settings } = useSettings();
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();

  // 格式化日期显示
  const formatDate = (dateString?: string) => {
    if (!dateString) return "未知";
    return new Date(dateString).toLocaleString();
  };

  // 复制令牌到剪贴板
  const copyTokenToClipboard = () => {
    if (settings.user?.token) {
      navigator.clipboard.writeText(settings.user.token);
      toast({
        title: "已复制",
        description: "令牌已复制到剪贴板",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">账户信息</h3>
        <p className="text-sm text-muted-foreground">
          管理您的账户信息和设备
        </p>
      </div>
      
      <Separator />
      
      {/* 用户基本信息 */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full overflow-hidden">
            {settings.user?.avatar ? (
              <img 
                src={settings.user.avatar} 
                alt={settings.user.name} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                <UserCog className="h-8 w-8 text-primary/40" />
              </div>
            )}
          </div>
          <div>
            <h4 className="text-xl font-medium">{settings.user?.name || "未知用户"}</h4>
            <p className="text-sm text-muted-foreground">{settings.user?.email || "无邮箱"}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>用户ID</Label>
            <div className="text-sm text-muted-foreground truncate">{settings.user?.id || "未知"}</div>
          </div>
          
          <div className="space-y-2">
            <Label>创建时间</Label>
            <div className="text-sm text-muted-foreground">{formatDate(settings.user?.created_at)}</div>
          </div>
          
          <div className="space-y-2">
            <Label>最后登录时间</Label>
            <div className="text-sm text-muted-foreground">{formatDate(settings.user?.last_login_at)}</div>
          </div>
          
          <div className="space-y-2">
            <Label>最后登录IP</Label>
            <div className="text-sm text-muted-foreground">{settings.user?.last_login_ip || "未知"}</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>认证令牌</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowToken(!showToken)}
              className="h-8 px-2"
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <div className="relative">
            <Input 
              value={showToken ? settings.user?.token || "" : "••••••••••••••••••••••••••"}
              readOnly
              className="pr-20"
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-0 top-0 h-full px-3"
              onClick={copyTokenToClipboard}
            >
              复制
            </Button>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* 设备信息 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">设备信息</h3>
        
        {settings.user?.devices && settings.user.devices.length > 0 ? (
          <div className="space-y-4">
            {settings.user.devices.map((device) => (
              <Card key={device.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{device.name}</h4>
                      {device.is_current && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full dark:bg-green-800/20 dark:text-green-400">
                          当前设备
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {device.os} {device.os_version}
                      {device.browser && ` • ${device.browser} ${device.browser_version || ""}`}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      最后活跃: {formatDate(device.last_active_at)}
                    </div>
                    {device.ip_address && (
                      <div className="text-xs text-muted-foreground">
                        IP: {device.ip_address}
                      </div>
                    )}
                  </div>
                  
                  {!device.is_current && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-6 border rounded-lg bg-muted/10">
            <p className="text-muted-foreground">没有设备信息</p>
          </div>
        )}
      </div>
    </div>
  );
}

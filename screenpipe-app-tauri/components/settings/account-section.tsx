"use client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useSettings } from "@/lib/hooks/use-settings";
import { LogOut, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";

export function AccountSection() {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const router = useRouter();

  // 格式化日期显示
  const formatDate = (dateString?: string) => {
    if (!dateString) return "未知";
    return new Date(dateString).toLocaleString();
  };

  // 登出功能
  const handleLogout = () => {
    updateSettings({ 
      user: { 
        id: "",
        email: "",
        name: ""
      },
      authToken: "" 
    });
    toast({
      title: "已登出",
      description: "您已成功登出ScreenPipe",
    });
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">账户信息</h3>
          <p className="text-sm text-muted-foreground">
            查看您的账户信息
          </p>
        </div>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span>登出</span>
        </Button>
      </div>
      
      <Separator />
      
      {/* 用户基本信息 - 简化版 */}
      <div className="bg-accent/10 rounded-lg p-6">
        <div className="flex items-center space-x-6">
          <div className="h-20 w-20 rounded-full overflow-hidden flex-shrink-0">
            {settings.user?.avatar ? (
              <img 
                src={settings.user.avatar} 
                alt={settings.user.name} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                <UserCog className="h-10 w-10 text-primary/40" />
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h4 className="text-2xl font-medium">{settings.user?.name || "未知用户"}</h4>
              <p className="text-muted-foreground">{settings.user?.email || "无邮箱"}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">用户ID:</span>
                <span className="font-medium truncate max-w-[200px]">{settings.user?.id || "未知"}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">创建时间:</span>
                <span className="font-medium">{formatDate(settings.user?.created_at)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">最后登录时间:</span>
                <span className="font-medium">{formatDate(settings.user?.last_login_at)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">最后登录IP:</span>
                <span className="font-medium">{settings.user?.last_login_ip || "未知"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 账户安全提示 */}
      <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 p-4 rounded-lg text-sm">
        <p>为了保障您的账户安全，请定期更改密码并确保您的邮箱地址是最新的。如需更改账户信息，请联系管理员。</p>
      </div>
    </div>
  );
}

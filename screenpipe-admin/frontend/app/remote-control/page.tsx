"use client";

import { ClientList } from "@/components/remote-control/client-list";
import { CommandHistory } from "@/components/remote-control/command-history";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoIcon } from "lucide-react";
import { useState } from "react";

export default function RemoteControlPage() {
    const [activeTab, setActiveTab] = useState("clients");

    return (
        <div className="container py-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">远程控制</h1>
                <p className="text-muted-foreground">
                    管理和控制连接的客户端设备，发送锁屏或关机命令
                </p>
            </div>

            <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>提示</AlertTitle>
                <AlertDescription>
                    远程控制功能允许您向已连接的客户端发送命令，如锁屏或关机。请确保客户端已安装并运行Time Glass应用。
                </AlertDescription>
            </Alert>

            <Tabs defaultValue="clients" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                    <TabsTrigger value="clients">客户端</TabsTrigger>
                    <TabsTrigger value="history">命令历史</TabsTrigger>
                </TabsList>
                <TabsContent value="clients" className="mt-6">
                    <Card className="p-6">
                        <ClientList />
                    </Card>
                </TabsContent>
                <TabsContent value="history" className="mt-6">
                    <Card className="p-6">
                        <CommandHistory />
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 
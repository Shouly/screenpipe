"use client";

import React, { useState } from 'react';
import UiMonitoringComponent from '@/components/ui-monitoring/UiMonitoringPage';

export default function Page() {
  const [clientId, setClientId] = useState<string>('');

  const handleClientIdChange = (newClientId: string) => {
    setClientId(newClientId);
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">UI 监控面板</h1>
          <p className="text-muted-foreground">
            跟踪和分析用户界面交互，了解应用程序使用模式
          </p>
        </div>
        
        <UiMonitoringComponent 
          clientId={clientId} 
          onClientIdChange={handleClientIdChange} 
        />
      </div>
    </div>
  );
} 
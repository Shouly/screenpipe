"use client";

import React, { useState } from 'react';
import OcrTextPage from '@/components/ocr-text/OcrTextPage';

export default function OcrTextPageRoute() {
  const [clientId, setClientId] = useState<string>('');

  const handleClientIdChange = (newClientId: string) => {
    setClientId(newClientId);
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">OCR 文本数据</h1>
          <p className="text-muted-foreground">
            查看和分析从屏幕捕获的OCR文本数据，了解应用程序内容
          </p>
        </div>
        
        <OcrTextPage 
          clientId={clientId} 
          onClientIdChange={handleClientIdChange} 
        />
      </div>
    </div>
  );
} 
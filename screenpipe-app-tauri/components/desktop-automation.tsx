"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { AppWindow, PlayIcon, Sparkles } from "lucide-react";

// 动态导入子组件以优化加载性能
const AutomationCreator = dynamic(() => import("./automation/automation-creator"), {
  loading: () => (
    <div className="flex items-center justify-center p-12 text-muted-foreground">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-8 w-8 rounded-full bg-muted mb-4"></div>
        <div className="h-4 w-48 bg-muted rounded"></div>
      </div>
    </div>
  )
});

const ScriptManager = dynamic(() => import("./automation/script-manager"), {
  loading: () => (
    <div className="flex items-center justify-center p-12 text-muted-foreground">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-8 w-8 rounded-full bg-muted mb-4"></div>
        <div className="h-4 w-48 bg-muted rounded"></div>
      </div>
    </div>
  )
});

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DesktopAutomation() {
  const [activeTab, setActiveTab] = useState("create");
  
  return (
    <motion.div 
      className="container mx-auto pt-8 pb-16 px-4 md:px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">桌面自动化</h1>
          <p className="text-muted-foreground mt-1">创建、管理和运行屏幕自动化脚本</p>
        </motion.div>
        <motion.div variants={item} className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          <Sparkles className="h-4 w-4" />
          <span>自动化重复任务，提升工作效率</span>
        </motion.div>
      </motion.div>
      
      <Tabs 
        defaultValue="create" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <div className="border-b mb-6">
          <TabsList className="w-full md:w-auto justify-start">
            <TabsTrigger value="create" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
              <AppWindow className="h-4 w-4" />
              <span>创建自动化</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
              <PlayIcon className="h-4 w-4" />
              <span>管理脚本</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="create" className="mt-0">
          <AutomationCreator />
        </TabsContent>
        
        <TabsContent value="manage" className="mt-0">
          <ScriptManager />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
} 
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import { 
  Loader2, PlayIcon, FileText, Trash2, Edit, 
  FilePlus, ArrowDownToLine, AlertCircle, 
  CheckCircle, Layers, PackageOpen, Clock, 
  BookOpen, Sparkles, Save
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ElementActionResult {
  success: boolean;
  error?: string;
}

interface ScriptInfo {
  name: string;
  path: string;
  created_at: string;
}

interface ScriptPreview {
  name: string;
  path: string;
  target_app: string;
  step_count: number;
  is_multi_step: boolean;
}

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

export default function ScriptManager() {
  const [savedScripts, setSavedScripts] = useState<ScriptInfo[]>([]);
  const [scriptPreviews, setScriptPreviews] = useState<Record<string, ScriptPreview>>({});
  const [isLoadingScripts, setIsLoadingScripts] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [selectedScriptPath, setSelectedScriptPath] = useState<string>("");
  const [currentScriptContent, setCurrentScriptContent] = useState<string>("");
  const [editScriptContent, setEditScriptContent] = useState<string>("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [actionResult, setActionResult] = useState<ElementActionResult | null>(null);
  const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<"basic" | "app_launch" | "multi_step" | "text_input">("basic");
  const [isBusy, setIsBusy] = useState(false);
  const { toast } = useToast();

  // 加载已保存的脚本列表
  useEffect(() => {
    loadSavedScripts();
  }, []);

  // 加载已保存的脚本列表
  const loadSavedScripts = async () => {
    try {
      setIsLoadingScripts(true);
      const scripts = await invoke<ScriptInfo[]>("list_automation_scripts");
      setSavedScripts(scripts);
      
      // 加载每个脚本的预览信息
      for (const script of scripts) {
        loadScriptPreview(script.path);
      }
    } catch (error) {
      console.error("无法加载自动化脚本列表:", error);
      toast({
        title: "错误",
        description: "无法加载自动化脚本列表",
        variant: "destructive",
      });
    } finally {
      setIsLoadingScripts(false);
    }
  };

  // 加载脚本预览信息
  const loadScriptPreview = async (path: string) => {
    try {
      setIsLoadingPreview(true);
      const preview = await invoke<ScriptPreview>("get_script_preview", { path });
      
      setScriptPreviews(prev => ({
        ...prev,
        [path]: preview
      }));
    } catch (error) {
      console.error("无法加载脚本预览:", error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // 从模板创建新脚本
  const createScriptFromTemplate = async () => {
    try {
      setIsBusy(true);
      const scriptContent = await invoke<string>("create_script_from_template", {
        templateType: selectedTemplate
      });
      
      toast({
        title: "模板脚本已创建",
        description: "已根据模板成功创建新脚本",
      });
      
      // 刷新脚本列表
      await loadSavedScripts();
      
      // 关闭模板对话框
      setIsCreateTemplateDialogOpen(false);
    } catch (error) {
      console.error("创建模板脚本失败:", error);
      toast({
        title: "错误",
        description: `创建模板脚本失败: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };
  
  // 加载特定脚本的内容
  const loadScriptContent = async (path: string) => {
    if (!path) return;
    
    try {
      setIsBusy(true);
      const content = await invoke<string>("load_automation_script", { path });
      setCurrentScriptContent(content);
      
      toast({
        title: "脚本已加载",
        description: "成功加载自动化脚本",
      });
    } catch (error) {
      console.error("加载脚本内容失败:", error);
      toast({
        title: "错误",
        description: `加载脚本内容失败: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };

  // 打开编辑对话框
  const openEditDialog = async (path: string) => {
    try {
      setIsBusy(true);
      const content = await invoke<string>("load_automation_script", { path });
      
      // 美化 JSON
      try {
        const parsed = JSON.parse(content);
        setEditScriptContent(JSON.stringify(parsed, null, 2));
      } catch {
        setEditScriptContent(content);
      }
      
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("加载脚本内容失败:", error);
      toast({
        title: "错误",
        description: `加载脚本内容失败: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };

  // 保存编辑后的脚本
  const saveEditedScript = async () => {
    if (!selectedScriptPath) return;
    
    try {
      // 验证 JSON 格式
      JSON.parse(editScriptContent);
      
      setIsBusy(true);
      await invoke("update_automation_script", { 
        path: selectedScriptPath, 
        content: editScriptContent 
      });
      
      toast({
        title: "脚本已更新",
        description: "自动化脚本已成功更新",
      });
      
      // 关闭编辑对话框
      setIsEditDialogOpen(false);
      
      // 刷新脚本列表和预览
      await loadSavedScripts();
      
      // 如果当前已加载了该脚本，更新当前脚本内容
      if (currentScriptContent) {
        await loadScriptContent(selectedScriptPath);
      }
    } catch (error) {
      console.error("更新脚本失败:", error);
      toast({
        title: "错误",
        description: `更新脚本失败: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };

  // 删除脚本
  const deleteScript = async () => {
    if (!selectedScriptPath) return;
    
    try {
      setIsBusy(true);
      await invoke("delete_automation_script", { path: selectedScriptPath });
      
      toast({
        title: "脚本已删除",
        description: "自动化脚本已成功删除",
      });
      
      // 关闭删除对话框
      setIsDeleteDialogOpen(false);
      
      // 清空当前选中的脚本
      if (selectedScriptPath === selectedScriptPath) {
        setCurrentScriptContent("");
      }
      
      // 刷新脚本列表
      await loadSavedScripts();
      
      // 重置选择
      setSelectedScriptPath("");
    } catch (error) {
      console.error("删除脚本失败:", error);
      toast({
        title: "错误",
        description: `删除脚本失败: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };

  // 运行已加载的脚本
  const runLoadedScript = async () => {
    if (!currentScriptContent) {
      toast({
        title: "请先加载脚本",
        description: "需要先加载脚本才能运行",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsBusy(true);
      const result = await invoke<ElementActionResult>("run_automation_script", {
        script: currentScriptContent
      });

      setActionResult(result);

      if (result.success) {
        toast({
          title: "脚本执行成功",
          description: "自动化脚本已成功运行",
        });
      } else {
        toast({
          title: "脚本执行失败",
          description: result.error || "未知错误",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("脚本执行失败:", error);
      toast({
        title: "错误",
        description: `脚本执行失败: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };

  // 渲染脚本预览信息
  const renderScriptPreviewInfo = (path: string) => {
    const preview = scriptPreviews[path];
    if (!preview) return null;
    
    return (
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center text-xs text-muted-foreground">
          <PackageOpen className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
          <span className="font-medium">应用：</span>
          <span className="ml-1">{preview.target_app}</span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
          <span className="font-medium">步骤：</span>
          <span className="ml-1">{preview.step_count}</span>
          {preview.is_multi_step && (
            <Badge variant="outline" className="ml-2 text-xs px-1.5 border-primary/20 bg-primary/5">多步骤</Badge>
          )}
        </div>
      </div>
    );
  };

  // 渲染模板选择界面
  const renderTemplateSelector = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block text-muted-foreground">选择模板类型</label>
          <Select value={selectedTemplate} onValueChange={(value: any) => setSelectedTemplate(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择模板类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">
                <div className="flex items-center">
                  <span className="bg-primary/10 p-1 rounded mr-2">
                    <FileText className="h-4 w-4 text-primary" />
                  </span>
                  <span>基础模板 - 单一操作</span>
                </div>
              </SelectItem>
              <SelectItem value="app_launch">
                <div className="flex items-center">
                  <span className="bg-primary/10 p-1 rounded mr-2">
                    <PlayIcon className="h-4 w-4 text-primary" />
                  </span>
                  <span>应用启动模板 - 自动启动应用</span>
                </div>
              </SelectItem>
              <SelectItem value="multi_step">
                <div className="flex items-center">
                  <span className="bg-primary/10 p-1 rounded mr-2">
                    <Layers className="h-4 w-4 text-primary" />
                  </span>
                  <span>多步骤模板 - 多个连续操作</span>
                </div>
              </SelectItem>
              <SelectItem value="text_input">
                <div className="flex items-center">
                  <span className="bg-primary/10 p-1 rounded mr-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </span>
                  <span>文本输入模板 - 包含输入文本</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Alert className="bg-muted/30 border-muted/50">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertTitle>提示</AlertTitle>
          <AlertDescription>
            创建模板后，您可以编辑脚本内容以适应您的实际需求。
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  // 模板选项描述
  const getTemplateDescription = () => {
    switch (selectedTemplate) {
      case "basic":
        return "创建一个简单的单步操作脚本，例如点击特定按钮。";
      case "app_launch":
        return "创建一个自动启动应用程序的脚本。";
      case "multi_step":
        return "创建包含多个连续步骤的复杂操作脚本。";
      case "text_input":
        return "创建包含文本输入操作的脚本。";
      default:
        return "";
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左侧面板 - 脚本列表 */}
        <div className="space-y-6">
          <Card className="border-muted/50 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="bg-primary/10 p-1.5 rounded-md">
                  <FileText className="h-5 w-5 text-primary" />
                </span>
                保存的自动化脚本
              </CardTitle>
              <CardDescription>选择一个已保存的脚本加载和运行</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadSavedScripts}
                  disabled={isLoadingScripts}
                  className="bg-muted/30 border-muted/50 hover:bg-primary/5"
                >
                  {isLoadingScripts ? 
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 
                    <ArrowDownToLine className="h-4 w-4 mr-2" />
                  }
                  刷新脚本列表
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsCreateTemplateDialogOpen(true)}
                  className="bg-muted/30 border-muted/50 hover:bg-primary/5"
                >
                  <FilePlus className="h-4 w-4 mr-2" />
                  从模板创建
                </Button>
              </div>
              
              <ScrollArea className="h-[500px] rounded-md border border-muted/40 p-4">
                {isLoadingScripts ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">正在加载脚本列表...</div>
                  </div>
                ) : savedScripts.length > 0 ? (
                  <motion.div 
                    className="space-y-3"
                    variants={container}
                    initial="hidden"
                    animate="show"
                  >
                    {savedScripts.map((script, index) => (
                      <motion.div 
                        key={script.path}
                        variants={item}
                        className={cn(
                          "p-4 rounded-md cursor-pointer hover:bg-accent transition-colors relative border overflow-hidden",
                          selectedScriptPath === script.path 
                            ? "bg-accent/30 text-accent-foreground border-primary/20" 
                            : "bg-muted/30 border-muted/50"
                        )}
                        onClick={() => setSelectedScriptPath(script.path)}
                      >
                        {selectedScriptPath === script.path && (
                          <div className="absolute left-0 top-0 w-1 h-full bg-primary" />
                        )}
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{script.name}</div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(script.path);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedScriptPath(script.path);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          <span>创建于: {script.created_at}</span>
                        </div>
                        {renderScriptPreviewInfo(script.path)}
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        repeat: Infinity,
                        repeatType: "reverse",
                        duration: 2
                      }}
                    >
                      <FileText className="h-12 w-12 text-muted-foreground/30" />
                    </motion.div>
                    <p className="text-muted-foreground">没有找到已保存的脚本。<br />请先创建并保存一些自动化脚本或从模板创建。</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsCreateTemplateDialogOpen(true)}
                      className="mt-2 bg-muted/30 border-muted/50 hover:bg-primary/5"
                    >
                      <FilePlus className="h-4 w-4 mr-2" />
                      从模板创建
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        {/* 右侧面板 - 脚本操作 */}
        <div className="space-y-6">
          <Card className="border-muted/50 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="bg-primary/10 p-1.5 rounded-md">
                  <PlayIcon className="h-5 w-5 text-primary" />
                </span>
                脚本操作
              </CardTitle>
              <CardDescription>加载和运行选定的脚本</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="bg-muted/30 border-muted/50 hover:bg-primary/5 relative overflow-hidden group"
                    onClick={() => loadScriptContent(selectedScriptPath)}
                    disabled={!selectedScriptPath || isBusy}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {isBusy ? 
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
                      <FileText className="h-4 w-4 mr-2" />
                    }
                    加载选中脚本
                  </Button>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Button 
                      variant="default" 
                      className="w-full relative overflow-hidden group"
                      onClick={runLoadedScript}
                      disabled={!currentScriptContent || isBusy}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {isBusy ? 
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
                        <PlayIcon className="h-4 w-4 mr-2" />
                      }
                      运行已加载脚本
                    </Button>
                  </motion.div>
                </div>
                
                {currentScriptContent ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-muted-foreground">脚本内容：</label>
                      <Badge variant="outline" className="text-xs px-1.5 bg-primary/5 border-primary/20">
                        JSON
                      </Badge>
                    </div>
                    <div className="relative">
                      <ScrollArea className="h-[350px] rounded-md border border-muted/40 bg-muted/10">
                        <pre className="font-mono text-xs p-4 whitespace-pre overflow-x-auto">
                          {JSON.stringify(JSON.parse(currentScriptContent), null, 2)}
                        </pre>
                      </ScrollArea>
                      <div className="absolute top-3 right-3">
                        <Badge variant="outline" className="text-xs bg-muted/60 backdrop-blur-sm">
                          只读
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ) : selectedScriptPath ? (
                  <div className="flex flex-col items-center justify-center py-12 mt-4 text-center text-muted-foreground border border-dashed border-muted/40 rounded-md bg-muted/20">
                    <FileText className="h-10 w-10 mb-3 text-muted-foreground/40" />
                    <p className="text-sm">请点击"加载选中脚本"按钮查看脚本内容</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 mt-4 text-center text-muted-foreground border border-dashed border-muted/40 rounded-md bg-muted/20">
                    <Sparkles className="h-10 w-10 mb-3 text-muted-foreground/40" />
                    <p className="text-sm">请先从左侧列表中选择一个脚本</p>
                  </div>
                )}
                
                {actionResult && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "p-4 rounded-md text-sm border",
                      actionResult.success 
                        ? "bg-green-50/50 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800/30" 
                        : "bg-red-50/50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800/30"
                    )}
                  >
                    <div className="flex items-start">
                      {actionResult.success 
                        ? <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 text-green-500" /> 
                        : <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />}
                      <div>
                        {actionResult.success 
                          ? "操作成功执行！" 
                          : `操作失败: ${actionResult.error || "未知错误"}`}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 编辑脚本对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              编辑自动化脚本
            </DialogTitle>
            <DialogDescription>
              修改脚本内容（请确保使用有效的 JSON 格式）
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border rounded-md relative overflow-hidden">
              <Textarea 
                className="font-mono text-sm h-[400px] w-full resize-none border-0 bg-muted/10 focus-visible:ring-0 focus-visible:ring-offset-0"
                value={editScriptContent}
                onChange={(e) => setEditScriptContent(e.target.value)}
              />
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="text-xs bg-muted/60 backdrop-blur-sm">
                  JSON
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-muted/50"
            >
              取消
            </Button>
            <Button
              onClick={saveEditedScript}
              disabled={isBusy}
              className="relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
              {isBusy ? 
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
                <Save className="h-4 w-4 mr-2" />
              }
              保存更改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 删除脚本确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              删除自动化脚本
            </DialogTitle>
            <DialogDescription>
              您确定要删除这个脚本吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-muted/50"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={deleteScript}
              disabled={isBusy}
              className="relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-destructive/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
              {isBusy ? 
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
                <Trash2 className="h-4 w-4 mr-2" />
              }
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 从模板创建脚本对话框 */}
      <Dialog open={isCreateTemplateDialogOpen} onOpenChange={setIsCreateTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FilePlus className="h-5 w-5 text-primary" />
              从模板创建自动化脚本
            </DialogTitle>
            <DialogDescription>
              选择一个模板作为新脚本的起点
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {renderTemplateSelector()}
            <div className="mt-4 p-3 rounded-md bg-primary/5 text-sm text-muted-foreground border border-primary/10">
              <p>{getTemplateDescription()}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateTemplateDialogOpen(false)}
              className="border-muted/50"
            >
              取消
            </Button>
            <Button
              onClick={createScriptFromTemplate}
              disabled={isBusy}
              className="relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
              {isBusy ? 
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
                <Save className="h-4 w-4 mr-2" />
              }
              创建脚本
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 
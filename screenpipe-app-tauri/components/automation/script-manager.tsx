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
import { motion } from "framer-motion";
import { 
  Loader2, PlayIcon, FileText, Trash2, Edit, 
  FilePlus, ArrowDownToLine, AlertCircle, 
  CheckCircle, Layers, PackageOpen, Clock, 
  BookOpen, Sparkles, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listAutomationScripts,
  loadAutomationScript,
  runAutomationScript,
  deleteAutomationScript,
  updateAutomationScript,
  getScriptPreview,
  createScriptFromTemplate as createFromTemplate,
  ScriptTemplateType,
  ElementActionResult,
  ScriptInfo,
  ScriptPreview
} from "@/lib/automation";

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
  const { toast } = useToast();
  
  const [scripts, setScripts] = useState<ScriptInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScriptPath, setSelectedScriptPath] = useState<string | null>(null);
  const [scriptContent, setScriptContent] = useState("");
  const [scriptPreview, setScriptPreview] = useState<ScriptPreview | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<ElementActionResult | null>(null);
  
  // 编辑相关状态
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // 删除相关状态
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 模板相关状态
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ScriptTemplateType>(ScriptTemplateType.Basic);
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false);
  
  // 加载保存的脚本列表
  useEffect(() => {
    loadSavedScripts();
  }, []);
  
  // 加载保存的脚本列表
  const loadSavedScripts = async () => {
    try {
      setIsLoading(true);
      
      // 使用新的JS库获取脚本列表
      const scriptList = await listAutomationScripts();
      setScripts(scriptList);
      
      // 如果有脚本，默认选择第一个
      if (scriptList.length > 0) {
        setSelectedScriptPath(scriptList[0].path);
        await loadScriptPreview(scriptList[0].path);
        await loadScriptContent(scriptList[0].path);
      }
    } catch (error) {
      console.error("加载脚本列表失败:", error);
      toast({
        title: "错误",
        description: "无法加载保存的脚本列表",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 加载脚本预览信息
  const loadScriptPreview = async (path: string) => {
    try {
      // 使用新的JS库获取脚本预览
      const preview = await getScriptPreview(path);
      setScriptPreview(preview);
    } catch (error) {
      console.error("加载脚本预览失败:", error);
      toast({
        title: "错误",
        description: "无法加载脚本预览信息",
        variant: "destructive",
      });
    }
  };
  
  // 从模板创建新脚本
  const createScriptFromTemplate = async () => {
    try {
      setIsCreatingFromTemplate(true);
      
      // 使用新的JS库创建模板脚本
      await createFromTemplate(selectedTemplate);
      
      toast({
        title: "创建成功",
        description: "已从模板创建新脚本",
      });
      
      // 重新加载脚本列表
      await loadSavedScripts();
      
      // 关闭模板对话框
      setIsTemplateDialogOpen(false);
    } catch (error) {
      console.error("创建模板脚本失败:", error);
      toast({
        title: "错误",
        description: "无法创建模板脚本",
        variant: "destructive",
      });
    } finally {
      setIsCreatingFromTemplate(false);
    }
  };
  
  // 加载脚本内容
  const loadScriptContent = async (path: string) => {
    if (!path) return;
    
    try {
      // 使用新的JS库加载脚本内容
      const content = await loadAutomationScript(path);
      setScriptContent(content);
      
      // 格式化JSON以便显示
      try {
        const formattedContent = JSON.stringify(JSON.parse(content), null, 2);
        setScriptContent(formattedContent);
      } catch (formatError) {
        console.warn("无法格式化脚本内容:", formatError);
        setScriptContent(content);
      }
    } catch (error) {
      console.error("加载脚本内容失败:", error);
      toast({
        title: "错误",
        description: "无法加载脚本内容",
        variant: "destructive",
      });
    }
  };
  
  // 打开编辑对话框
  const openEditDialog = async (path: string) => {
    try {
      // 使用新的JS库加载脚本内容
      const content = await loadAutomationScript(path);
      
      // 格式化JSON以便编辑
      try {
        const formattedContent = JSON.stringify(JSON.parse(content), null, 2);
        setEditedContent(formattedContent);
      } catch (formatError) {
        console.warn("无法格式化脚本内容:", formatError);
        setEditedContent(content);
      }
      
      // 打开编辑对话框
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("准备编辑脚本失败:", error);
      toast({
        title: "错误",
        description: "无法加载脚本内容进行编辑",
        variant: "destructive",
      });
    }
  };
  
  // 保存编辑后的脚本
  const saveEditedScript = async () => {
    if (!selectedScriptPath) return;
    
    try {
      setIsEditing(true);
      
      // 验证JSON格式
      try {
        JSON.parse(editedContent);
      } catch (parseError) {
        toast({
          title: "无效的JSON",
          description: "脚本内容不是有效的JSON格式",
          variant: "destructive",
        });
        return;
      }
      
      // 使用新的JS库更新脚本
      await updateAutomationScript(selectedScriptPath, editedContent);
      
      toast({
        title: "保存成功",
        description: "脚本已成功更新",
      });
      
      // 关闭编辑对话框
      setIsEditDialogOpen(false);
      
      // 重新加载脚本内容和预览
      await loadScriptContent(selectedScriptPath);
      await loadScriptPreview(selectedScriptPath);
    } catch (error) {
      console.error("保存编辑后的脚本失败:", error);
      toast({
        title: "错误",
        description: "无法保存编辑后的脚本",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };
  
  // 删除脚本
  const deleteScript = async () => {
    if (!selectedScriptPath) return;
    
    try {
      setIsDeleting(true);
      
      // 使用新的JS库删除脚本
      await deleteAutomationScript(selectedScriptPath);
      
      toast({
        title: "删除成功",
        description: "脚本已成功删除",
      });
      
      // 关闭删除对话框
      setIsDeleteDialogOpen(false);
      
      // 重新加载脚本列表
      await loadSavedScripts();
      
      // 清空选中的脚本
      setSelectedScriptPath(null);
      setScriptContent("");
      setScriptPreview(null);
    } catch (error) {
      console.error("删除脚本失败:", error);
      toast({
        title: "错误",
        description: "无法删除脚本",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // 运行加载的脚本
  const runLoadedScript = async () => {
    if (!scriptContent) {
      toast({
        title: "没有脚本内容",
        description: "请先选择一个脚本",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsRunning(true);
      setRunResult(null);
      
      // 使用新的JS库运行脚本
      const result = await runAutomationScript(scriptContent);
      setRunResult(result);
      
      if (result.success) {
        toast({
          title: "执行成功",
          description: "脚本已成功执行",
        });
      } else {
        toast({
          title: "执行失败",
          description: result.error || "未知错误",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("运行脚本失败:", error);
      toast({
        title: "错误",
        description: `运行脚本失败: ${error}`,
        variant: "destructive",
      });
      
      setRunResult({
        success: false,
        error: `运行脚本失败: ${error}`
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 渲染脚本预览信息
  const renderScriptPreviewInfo = (path: string) => {
    const preview = scriptPreview;
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
                  disabled={isLoading}
                  className="bg-muted/30 border-muted/50 hover:bg-primary/5"
                >
                  {isLoading ? 
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 
                    <ArrowDownToLine className="h-4 w-4 mr-2" />
                  }
                  刷新脚本列表
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsTemplateDialogOpen(true)}
                  className="bg-muted/30 border-muted/50 hover:bg-primary/5"
                >
                  <FilePlus className="h-4 w-4 mr-2" />
                  从模板创建
                </Button>
              </div>
              
              <ScrollArea className="h-[500px] rounded-md border border-muted/40 p-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">正在加载脚本列表...</div>
                  </div>
                ) : scripts.length > 0 ? (
                  <motion.div 
                    className="space-y-3"
                    variants={container}
                    initial="hidden"
                    animate="show"
                  >
                    {scripts.map((script, index) => (
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
                      onClick={() => setIsTemplateDialogOpen(true)}
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
                    size="sm"
                    onClick={() => selectedScriptPath && loadScriptContent(selectedScriptPath)}
                    disabled={!selectedScriptPath || isRunning}
                    className="bg-muted/30 border-muted/50 hover:bg-primary/5 relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {isRunning ? 
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
                      <FileText className="h-4 w-4 mr-2" />
                    }
                    <span>加载脚本</span>
                  </Button>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Button 
                      variant="default" 
                      className="w-full relative overflow-hidden group"
                      onClick={runLoadedScript}
                      disabled={!scriptContent || isRunning}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {isRunning ? 
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
                        <PlayIcon className="h-4 w-4 mr-2" />
                      }
                      运行已加载脚本
                    </Button>
                  </motion.div>
                </div>
                
                {scriptContent ? (
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
                          {JSON.stringify(JSON.parse(scriptContent), null, 2)}
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
                
                {runResult && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "p-4 rounded-md text-sm border",
                      runResult.success 
                        ? "bg-green-50/50 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800/30" 
                        : "bg-red-50/50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800/30"
                    )}
                  >
                    <div className="flex items-start">
                      {runResult.success 
                        ? <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 text-green-500" /> 
                        : <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />}
                      <div>
                        {runResult.success 
                          ? "操作成功执行！" 
                          : `操作失败: ${runResult.error || "未知错误"}`}
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
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
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
              disabled={isEditing}
              className="relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
              {isEditing ? 
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
              disabled={isDeleting}
              className="relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-destructive/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
              {isDeleting ? 
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
                <Trash2 className="h-4 w-4 mr-2" />
              }
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 从模板创建脚本对话框 */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
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
              onClick={() => setIsTemplateDialogOpen(false)}
              className="border-muted/50"
            >
              取消
            </Button>
            <Button
              onClick={createScriptFromTemplate}
              disabled={isCreatingFromTemplate}
              className="relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
              {isCreatingFromTemplate ? 
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
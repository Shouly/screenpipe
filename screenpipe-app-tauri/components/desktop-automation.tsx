"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { invoke } from "@tauri-apps/api/core";
import { Loader2, Search, MousePointer, MousePointerClick, Type, EyeIcon, PlayIcon, Save, FileText, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface UIElementProps {
  role: string;
  id?: string;
  label?: string;
  value?: string;
  bounds?: [number, number, number, number];
  children?: UIElementProps[];
  has_children: boolean;
  element_id?: string;
  // 前端状态属性
  isExpanded?: boolean;
  isLoading?: boolean;
}

interface ElementActionResult {
  success: boolean;
  error?: string;
}

interface ScriptInfo {
  name: string;
  path: string;
  created_at: string;
}

export default function DesktopAutomation() {
  const [applications, setApplications] = useState<string[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [elementTree, setElementTree] = useState<UIElementProps[]>([]);
  const [isLoadingElements, setIsLoadingElements] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedElement, setSelectedElement] = useState<UIElementProps | null>(null);
  const [selectorType, setSelectorType] = useState<"role" | "id" | "name" | "text">("role");
  const [selectorValue, setSelectorValue] = useState("");
  const [actionResult, setActionResult] = useState<ElementActionResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const { toast } = useToast();
  
  // 自动化脚本相关状态
  const [savedScripts, setSavedScripts] = useState<ScriptInfo[]>([]);
  const [isLoadingScripts, setIsLoadingScripts] = useState(false);
  const [selectedScriptPath, setSelectedScriptPath] = useState<string>("");
  const [currentScriptContent, setCurrentScriptContent] = useState<string>("");

  // 加载应用程序列表
  useEffect(() => {
    async function loadApplications() {
      try {
        setIsLoadingApps(true);
        // 调用 Tauri 函数获取应用程序列表
        const apps = await invoke<string[]>("get_applications");
        setApplications(apps);
      } catch (error) {
        console.error("无法加载应用程序列表:", error);
        toast({
          title: "错误",
          description: "无法加载应用程序列表",
          variant: "destructive",
        });
      } finally {
        setIsLoadingApps(false);
      }
    }

    loadApplications();
    // 同时加载已保存的脚本
    loadSavedScripts();
  }, []);

  // 加载已保存的脚本列表
  const loadSavedScripts = async () => {
    try {
      setIsLoadingScripts(true);
      const scripts = await invoke<ScriptInfo[]>("list_automation_scripts");
      setSavedScripts(scripts);
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

  // 加载应用程序元素树(顶层)
  const loadAppElements = async () => {
    if (!selectedApp) return;

    try {
      setIsLoadingElements(true);
      // 调用 Tauri 函数获取应用程序顶层元素
      const elements = await invoke<UIElementProps[]>("get_app_elements", {
        appName: selectedApp
      });
      
      // 添加前端状态属性
      const elementsWithState = elements.map(el => ({
        ...el,
        isExpanded: false,
        isLoading: false
      }));
      
      setElementTree(elementsWithState);
    } catch (error) {
      console.error("无法加载应用程序元素:", error);
      toast({
        title: "错误",
        description: "无法加载应用程序元素",
        variant: "destructive",
      });
    } finally {
      setIsLoadingElements(false);
    }
  };

  // 懒加载元素的子元素
  const loadElementChildren = async (element: UIElementProps, path: number[]) => {
    if (!element.has_children || !selectedApp) return;
    
    // 更新元素状态为加载中
    updateElementInTree(path, { isLoading: true });
    
    try {
      // 确定选择器类型和值
      let selectorType = "role";
      let selectorValue = element.role;
      
      // 如果有ID，优先使用ID选择器
      if (element.id) {
        selectorType = "id";
        selectorValue = element.id;
      }
      
      // 调用后端API获取子元素
      const childElements = await invoke<UIElementProps[]>("get_element_children", {
        appName: selectedApp,
        selectorType,
        selectorValue
      });
      
      // 添加前端状态属性
      const childrenWithState = childElements.map(el => ({
        ...el,
        isExpanded: false,
        isLoading: false
      }));
      
      // 更新元素状态
      updateElementInTree(path, { 
        isLoading: false, 
        isExpanded: true,
        children: childrenWithState
      });
    } catch (error) {
      console.error("无法加载子元素:", error);
      // 更新元素状态，取消加载中
      updateElementInTree(path, { isLoading: false });
      
      toast({
        title: "错误",
        description: "无法加载子元素",
        variant: "destructive",
      });
    }
  };

  // 更新元素树中的特定元素
  const updateElementInTree = (path: number[], updates: Partial<UIElementProps>) => {
    setElementTree(prevTree => {
      const newTree = [...prevTree];
      
      // 根据路径找到并更新元素
      let current = newTree;
      let target: any = null;
      
      for (let i = 0; i < path.length; i++) {
        const index = path[i];
        if (i === path.length - 1) {
          // 找到目标元素
          target = current[index];
        } else {
          // 继续遍历
          current = current[index].children || [];
        }
      }
      
      if (target) {
        // 应用更新
        Object.assign(target, updates);
      }
      
      return newTree;
    });
  };
  
  // 切换元素的展开/折叠状态
  const toggleElement = async (element: UIElementProps, path: number[]) => {
    if (element.isExpanded) {
      // 折叠元素
      updateElementInTree(path, { isExpanded: false });
    } else if (element.has_children) {
      // 元素有子元素但尚未加载
      if (!element.children || element.children.length === 0) {
        await loadElementChildren(element, path);
      } else {
        // 子元素已加载，只需展开
        updateElementInTree(path, { isExpanded: true });
      }
    }
  };

  // 渲染元素树的递归函数
  const renderElementTree = (elements: UIElementProps[], path: number[] = []) => {
    if (!elements || elements.length === 0) return null;

    return (
      <div className={cn("pl-0")}>
        {elements.map((element, index) => {
          // 当前元素的路径
          const currentPath = [...path, index];
          
          // 过滤逻辑，如果有搜索查询，只显示匹配的元素
          const isMatch = 
            !searchQuery || 
            element.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            element.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            element.id?.toLowerCase().includes(searchQuery.toLowerCase());

          if (!isMatch && (!element.children || element.children.length === 0)) {
            return null;
          }

          // 是否有可见的子元素
          const hasVisibleChildren = element.isExpanded && 
            element.children && 
            element.children.length > 0;

          return (
            <div key={`${element.role}-${index}-${path.join('-')}`} className="my-1">
              {isMatch && (
                <div className="flex items-center">
                  {/* 展开/折叠图标 */}
                  {element.has_children ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0 mr-1"
                      onClick={() => toggleElement(element, currentPath)}
                    >
                      {element.isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : element.isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <div className="w-7"></div> /* 占位 */
                  )}

                  {/* 元素信息 */}
                  <div 
                    className={cn(
                      "py-1 px-2 rounded text-sm cursor-pointer hover:bg-accent transition-colors flex-1",
                      selectedElement === element ? "bg-accent text-accent-foreground" : ""
                    )}
                    onClick={() => {
                      setSelectedElement(element);
                      setSelectorType("role");
                      setSelectorValue(element.role);
                    }}
                  >
                    <span className="font-medium">{element.role}</span>
                    {element.label && <span className="ml-2 text-xs opacity-70">"{element.label}"</span>}
                    {element.id && <span className="ml-2 text-xs opacity-70">#{element.id}</span>}
                  </div>
                </div>
              )}
              
              {/* 子元素 */}
              {hasVisibleChildren && (
                <div className="pl-7 mt-1 border-l border-muted">
                  {renderElementTree(element.children || [], currentPath)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // 加载特定脚本的内容
  const loadScriptContent = async (path: string) => {
    if (!path) return;
    
    try {
      setIsBusy(true);
      const content = await invoke<string>("load_automation_script", { path });
      setCurrentScriptContent(content);
      
      // 解析脚本内容并设置相关字段
      const scriptData = JSON.parse(content);
      if (scriptData.app) {
        setSelectedApp(scriptData.app);
      }
      
      if (scriptData.selector) {
        setSelectorType(scriptData.selector.type_ as any);
        setSelectorValue(scriptData.selector.value);
      }
      
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

  // 执行元素操作
  const performAction = async (action: string) => {
    if (!selectedApp || !selectorValue) {
      toast({
        title: "请选择应用程序和设置选择器",
        description: "需要应用程序名称和选择器值才能执行操作",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsBusy(true);
      // 构建选择器
      const selector = {
        type_: selectorType,
        value: selectorValue
      };

      // 调用 Tauri 函数执行操作
      const result = await invoke<ElementActionResult>("perform_element_action", {
        appName: selectedApp,
        selector,
        action,
      });

      setActionResult(result);

      if (result.success) {
        toast({
          title: "操作成功",
          description: `在 ${selectedApp} 上成功执行了 ${action} 操作`,
        });
      } else {
        toast({
          title: "操作失败",
          description: result.error || "未知错误",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`执行操作 ${action} 失败:`, error);
      toast({
        title: "错误",
        description: `执行操作失败: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };

  // 保存自动化脚本
  const saveAutomationScript = async () => {
    if (!selectedApp || !selectorValue) {
      toast({
        title: "请选择应用程序和设置选择器",
        description: "需要应用程序名称和选择器值才能保存脚本",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsBusy(true);
      // 构建自动化脚本
      const script = {
        app: selectedApp,
        selector: {
          type_: selectorType,
          value: selectorValue
        },
        action: "click" // 默认操作为点击
      };

      // 调用 Tauri 函数保存脚本
      await invoke("save_automation_script", {
        script: JSON.stringify(script)
      });

      toast({
        title: "脚本已保存",
        description: "自动化脚本已成功保存",
      });
      
      // 刷新脚本列表
      loadSavedScripts();
    } catch (error) {
      console.error("保存自动化脚本失败:", error);
      toast({
        title: "错误",
        description: `保存自动化脚本失败: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="container mx-auto pt-8 pb-16 px-4">
      <h1 className="text-2xl font-bold mb-8">桌面自动化</h1>
      
      {/* 添加一个新的标签切换：创建/加载 */}
      <Tabs defaultValue="create" className="mb-6">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="create">创建自动化</TabsTrigger>
          <TabsTrigger value="load">已保存脚本</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 左侧面板 - 应用与元素选择 */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>选择应用程序</CardTitle>
                  <CardDescription>选择要自动化的应用程序</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={selectedApp}
                      onValueChange={(value) => {
                        setSelectedApp(value);
                        setElementTree([]);
                        setSelectedElement(null);
                      }}
                      disabled={isLoadingApps}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择应用程序" />
                      </SelectTrigger>
                      <SelectContent>
                        {applications.map((app) => (
                          <SelectItem key={app} value={app}>
                            {app}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={loadAppElements}
                      disabled={!selectedApp || isLoadingElements}
                    >
                      {isLoadingElements ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {selectedApp && (
                <Card>
                  <CardHeader>
                    <CardTitle>应用程序元素</CardTitle>
                    <CardDescription>浏览应用程序的 UI 元素（点击箭头展开）</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <Input
                        placeholder="搜索元素..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                    <ScrollArea className="h-[500px] rounded-md border p-4">
                      {isLoadingElements ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : elementTree.length > 0 ? (
                        renderElementTree(elementTree)
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          <p>请点击搜索按钮加载应用程序元素</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* 右侧面板 - 选择器与操作 */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>元素选择器</CardTitle>
                  <CardDescription>选择要操作的元素</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="role" value={selectorType} onValueChange={(v) => setSelectorType(v as any)}>
                    <TabsList className="grid grid-cols-4 mb-4">
                      <TabsTrigger value="role">角色</TabsTrigger>
                      <TabsTrigger value="id">ID</TabsTrigger>
                      <TabsTrigger value="name">名称</TabsTrigger>
                      <TabsTrigger value="text">文本</TabsTrigger>
                    </TabsList>
                    <TabsContent value="role">
                      <Input
                        placeholder="元素角色，例如 button, textfield"
                        value={selectorValue}
                        onChange={(e) => setSelectorValue(e.target.value)}
                      />
                    </TabsContent>
                    <TabsContent value="id">
                      <Input
                        placeholder="元素ID"
                        value={selectorValue}
                        onChange={(e) => setSelectorValue(e.target.value)}
                      />
                    </TabsContent>
                    <TabsContent value="name">
                      <Input
                        placeholder="元素名称/标签"
                        value={selectorValue}
                        onChange={(e) => setSelectorValue(e.target.value)}
                      />
                    </TabsContent>
                    <TabsContent value="text">
                      <Input
                        placeholder="元素文本内容"
                        value={selectorValue}
                        onChange={(e) => setSelectorValue(e.target.value)}
                      />
                    </TabsContent>
                  </Tabs>

                  {selectedElement && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <h4 className="font-medium mb-2">选中的元素：</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>角色: <span className="font-mono">{selectedElement.role}</span></div>
                        {selectedElement.id && <div>ID: <span className="font-mono">{selectedElement.id}</span></div>}
                        {selectedElement.label && <div>标签: <span className="font-mono">{selectedElement.label}</span></div>}
                        {selectedElement.value && <div>值: <span className="font-mono">{selectedElement.value}</span></div>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>元素操作</CardTitle>
                  <CardDescription>对选定的元素执行操作</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center justify-center h-20 p-2"
                      onClick={() => performAction("click")}
                      disabled={isBusy || !selectorValue}
                    >
                      <MousePointerClick className="h-6 w-6 mb-1" />
                      <span className="text-xs">点击</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center justify-center h-20 p-2"
                      onClick={() => performAction("hover")}
                      disabled={isBusy || !selectorValue}
                    >
                      <MousePointer className="h-6 w-6 mb-1" />
                      <span className="text-xs">悬停</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center justify-center h-20 p-2"
                      onClick={() => performAction("focus")}
                      disabled={isBusy || !selectorValue}
                    >
                      <EyeIcon className="h-6 w-6 mb-1" />
                      <span className="text-xs">焦点</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center justify-center h-20 p-2"
                      onClick={() => performAction("get_text")}
                      disabled={isBusy || !selectorValue}
                    >
                      <Type className="h-6 w-6 mb-1" />
                      <span className="text-xs">获取文本</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center justify-center h-20 p-2 col-span-2 sm:col-span-1"
                      onClick={() => performAction("custom")}
                      disabled={isBusy || !selectorValue}
                    >
                      <PlayIcon className="h-6 w-6 mb-1" />
                      <span className="text-xs">自定义操作</span>
                    </Button>
                  </div>

                  <Separator className="my-4" />

                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={saveAutomationScript}
                    disabled={isBusy || !selectorValue}
                  >
                    {isBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    保存自动化脚本
                  </Button>

                  {actionResult && (
                    <div className={cn(
                      "mt-4 p-3 rounded-md text-sm",
                      actionResult.success ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300" : 
                                             "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300"
                    )}>
                      {actionResult.success 
                        ? "操作成功执行！" 
                        : `操作失败: ${actionResult.error || "未知错误"}`}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="load">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 左侧面板 - 脚本列表 */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>保存的自动化脚本</CardTitle>
                  <CardDescription>选择一个已保存的脚本加载和运行</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={loadSavedScripts}
                      disabled={isLoadingScripts}
                    >
                      {isLoadingScripts ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                      刷新脚本列表
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[400px] rounded-md border p-4">
                    {isLoadingScripts ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : savedScripts.length > 0 ? (
                      <div className="space-y-2">
                        {savedScripts.map((script) => (
                          <div 
                            key={script.path}
                            className={cn(
                              "p-3 rounded-md cursor-pointer hover:bg-accent transition-colors",
                              selectedScriptPath === script.path ? "bg-accent text-accent-foreground" : "bg-muted"
                            )}
                            onClick={() => setSelectedScriptPath(script.path)}
                          >
                            <div className="font-medium">{script.name}</div>
                            <div className="text-xs text-muted-foreground">创建时间: {script.created_at}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        没有找到已保存的脚本。请先创建并保存一些自动化脚本。
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            
            {/* 右侧面板 - 脚本操作 */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>脚本操作</CardTitle>
                  <CardDescription>加载和运行选定的脚本</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => loadScriptContent(selectedScriptPath)}
                      disabled={!selectedScriptPath || isBusy}
                    >
                      {isBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                      加载选中脚本
                    </Button>
                    
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={runLoadedScript}
                      disabled={!currentScriptContent || isBusy}
                    >
                      {isBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlayIcon className="h-4 w-4 mr-2" />}
                      运行已加载脚本
                    </Button>
                    
                    {currentScriptContent && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <h4 className="font-medium mb-2">已加载的脚本：</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>应用程序: <span className="font-mono">{selectedApp}</span></div>
                          <div>选择器类型: <span className="font-mono">{selectorType}</span></div>
                          <div>选择器值: <span className="font-mono">{selectorValue}</span></div>
                        </div>
                      </div>
                    )}
                    
                    {actionResult && (
                      <div className={cn(
                        "mt-4 p-3 rounded-md text-sm",
                        actionResult.success ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300" : 
                                               "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300"
                      )}>
                        {actionResult.success 
                          ? "操作成功执行！" 
                          : `操作失败: ${actionResult.error || "未知错误"}`}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
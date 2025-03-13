"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { invoke } from "@tauri-apps/api/core";
import { 
  Loader2, Search, MousePointer, MousePointerClick, 
  Type, EyeIcon, PlayIcon, Save, ChevronRight, 
  ChevronDown, AppWindow, Keyboard, Plus, ArrowRight, 
  Layers, Puzzle, Settings, RefreshCw, CheckCircle, AlertCircle,
  FileText
} from "lucide-react";
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

export interface AutomationStep {
  name: string;
  action: string;
  app: string;
  selector?: {
    type_: string;
    value: string;
  };
  wait?: number;
  text?: string;
}

export default function AutomationCreator() {
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

  // 多步骤脚本相关状态
  const [isMultiStep, setIsMultiStep] = useState(false);
  const [scriptSteps, setScriptSteps] = useState<AutomationStep[]>([]);
  const [currentStepName, setCurrentStepName] = useState("");
  const [selectedAction, setSelectedAction] = useState("click");
  const [waitTime, setWaitTime] = useState<number>(0);
  const [inputText, setInputText] = useState("");
  const [multiStepMode, setMultiStepMode] = useState<"list" | "json">("list");
  const [jsonScript, setJsonScript] = useState("");

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
  }, []);

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

  // 添加多步骤脚本的步骤
  const addScriptStep = () => {
    if (!selectedApp) {
      toast({
        title: "请选择应用程序",
        description: "需要选择一个应用程序才能添加步骤",
        variant: "destructive",
      });
      return;
    }

    // 对于非元素操作类型的步骤（如 launch_app），不需要选择器
    const needsSelector = selectedAction !== "launch_app" && selectedAction !== "key_press";
    if (needsSelector && !selectorValue) {
      toast({
        title: "请设置选择器",
        description: "需要设置选择器才能添加步骤",
        variant: "destructive",
      });
      return;
    }

    // 对于 input_text 操作，需要输入文本
    if (selectedAction === "input_text" && !inputText) {
      toast({
        title: "请输入文本",
        description: "执行输入文本操作需要提供要输入的文本",
        variant: "destructive",
      });
      return;
    }

    // 对于 key_press 操作，需要指定按键
    if (selectedAction === "key_press" && !inputText) {
      toast({
        title: "请指定按键",
        description: "执行按键操作需要提供要按的键",
        variant: "destructive",
      });
      return;
    }

    // 构建步骤对象
    const stepName = currentStepName || `步骤 ${scriptSteps.length + 1}`;
    const newStep: AutomationStep = {
      name: stepName,
      action: selectedAction,
      app: selectedApp
    };

    // 添加选择器（如果需要）
    if (needsSelector) {
      newStep.selector = {
        type_: selectorType,
        value: selectorValue
      };
    }

    // 添加等待时间（如果有）
    if (waitTime > 0) {
      newStep.wait = waitTime;
    }

    // 添加文本（如果需要）
    if ((selectedAction === "input_text" || selectedAction === "key_press") && inputText) {
      newStep.text = inputText;
    }

    // 添加到步骤列表
    setScriptSteps([...scriptSteps, newStep]);

    // 更新JSON表示
    updateJsonScript([...scriptSteps, newStep]);

    // 重置部分表单字段，保留应用程序选择
    setCurrentStepName("");
    setWaitTime(0);
    setInputText("");
    
    toast({
      title: "已添加步骤",
      description: `已成功添加步骤: ${stepName}`,
    });
  };

  // 更新JSON脚本
  const updateJsonScript = (steps: AutomationStep[]) => {
    const scriptObj = {
      steps: steps
    };
    setJsonScript(JSON.stringify(scriptObj, null, 2));
  };

  // 从JSON更新步骤列表
  const updateStepsFromJson = () => {
    try {
      const scriptObj = JSON.parse(jsonScript);
      if (Array.isArray(scriptObj.steps)) {
        setScriptSteps(scriptObj.steps);
        toast({
          title: "已更新步骤列表",
          description: `从JSON解析了 ${scriptObj.steps.length} 个步骤`,
        });
      } else {
        toast({
          title: "无效的JSON格式",
          description: "JSON中缺少steps数组",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("解析JSON失败:", error);
      toast({
        title: "解析JSON失败",
        description: "请检查JSON格式是否正确",
        variant: "destructive",
      });
    }
  };

  // 执行元素操作（测试）
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

      // 可选的文本参数
      const text = action === "input_text" || action === "key_press" ? inputText : undefined;

      // 调用 Tauri 函数执行操作
      const result = await invoke<ElementActionResult>("perform_element_action", {
        appName: selectedApp,
        selector,
        action,
        text
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
    if (isMultiStep) {
      if (scriptSteps.length === 0) {
        toast({
          title: "请添加脚本步骤",
          description: "多步骤脚本至少需要一个步骤",
          variant: "destructive",
        });
        return;
      }

      try {
        setIsBusy(true);
        // 构建多步骤脚本
        const script = {
          steps: scriptSteps
        };

        // 调用 Tauri 函数保存脚本
        await invoke("save_automation_script", {
          script: JSON.stringify(script)
        });

        toast({
          title: "脚本已保存",
          description: "多步骤自动化脚本已成功保存",
        });
        
        // 清空步骤列表以便创建新脚本
        setScriptSteps([]);
        setJsonScript("");
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
    } else {
      // 单步骤脚本（原有逻辑）
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
        // 构建单步骤自动化脚本
        const script = {
          app: selectedApp,
          selector: {
            type_: selectorType,
            value: selectorValue
          },
          action: selectedAction
        };

        // 如果是输入文本操作，添加文本字段
        if (selectedAction === "input_text" && inputText) {
          (script as any).text = inputText;
        }

        // 调用 Tauri 函数保存脚本
        await invoke("save_automation_script", {
          script: JSON.stringify(script)
        });

        toast({
          title: "脚本已保存",
          description: "自动化脚本已成功保存",
        });
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
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* 脚本类型选择 */}
      <Card className="overflow-hidden border-muted/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <span className="bg-primary/10 p-1.5 rounded-md">
              <Layers className="h-5 w-5 text-primary" />
            </span>
            自动化脚本类型
          </CardTitle>
          <CardDescription>选择创建单步骤脚本还是多步骤脚本</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <Button 
              variant={isMultiStep ? "outline" : "default"} 
              onClick={() => {
                setIsMultiStep(false);
                setScriptSteps([]);
              }}
              className="flex-1 relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <MousePointerClick className="h-4 w-4 mr-2" />
              单步骤脚本
            </Button>
            <Button 
              variant={isMultiStep ? "default" : "outline"} 
              onClick={() => setIsMultiStep(true)}
              className="flex-1 relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <Plus className="h-4 w-4 mr-2" />
              多步骤脚本
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左侧面板 - 应用与元素选择 */}
        <div className="space-y-6">
          <Card className="border-muted/50 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="bg-primary/10 p-1.5 rounded-md">
                  <AppWindow className="h-5 w-5 text-primary" />
                </span>
                选择应用程序
              </CardTitle>
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
                    {applications.length === 0 && !isLoadingApps && (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        <div className="mb-2">
                          <AppWindow className="h-10 w-10 mx-auto opacity-20" />
                        </div>
                        没有找到应用程序
                      </div>
                    )}
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
                  className="transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                >
                  {isLoadingElements ? 
                    <Loader2 className="h-4 w-4 animate-spin" /> : 
                    <motion.div
                      whileHover={{ rotate: 45 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    >
                      <Search className="h-4 w-4" />
                    </motion.div>
                  }
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedApp && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-muted/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span className="bg-primary/10 p-1.5 rounded-md">
                      <Puzzle className="h-5 w-5 text-primary" />
                    </span>
                    应用程序元素
                  </CardTitle>
                  <CardDescription>浏览应用程序的 UI 元素（点击箭头展开）</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="搜索元素..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[500px] rounded-md border border-muted/40 p-4">
                    {isLoadingElements ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <div className="text-sm text-muted-foreground">正在加载元素...</div>
                      </div>
                    ) : elementTree.length > 0 ? (
                      renderElementTree(elementTree)
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
                          <MousePointerClick className="h-12 w-12 text-muted-foreground/30" />
                        </motion.div>
                        <p className="text-muted-foreground">请点击搜索按钮加载应用程序元素</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
        
        {/* 右侧面板 - 选择器与操作 */}
        <div className="space-y-6">
          <Card className="border-muted/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="bg-primary/10 p-1.5 rounded-md">
                  <MousePointer className="h-5 w-5 text-primary" />
                </span>
                元素选择器
              </CardTitle>
              <CardDescription>选择要操作的元素</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="role" value={selectorType} onValueChange={(v) => setSelectorType(v as any)}>
                <TabsList className="grid grid-cols-4 mb-4 w-full">
                  <TabsTrigger value="role" className="data-[state=active]:bg-primary/10">角色</TabsTrigger>
                  <TabsTrigger value="id" className="data-[state=active]:bg-primary/10">ID</TabsTrigger>
                  <TabsTrigger value="name" className="data-[state=active]:bg-primary/10">名称</TabsTrigger>
                  <TabsTrigger value="text" className="data-[state=active]:bg-primary/10">文本</TabsTrigger>
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
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 p-4 bg-muted/30 backdrop-blur-sm rounded-md border border-muted/40"
                >
                  <h4 className="font-medium mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    选中的元素
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <span className="text-muted-foreground mr-2">角色:</span>
                      <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-xs">{selectedElement.role}</span>
                    </div>
                    {selectedElement.id && (
                      <div className="flex items-center">
                        <span className="text-muted-foreground mr-2">ID:</span>
                        <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-xs">{selectedElement.id}</span>
                      </div>
                    )}
                    {selectedElement.label && (
                      <div className="flex items-center">
                        <span className="text-muted-foreground mr-2">标签:</span>
                        <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-xs">{selectedElement.label}</span>
                      </div>
                    )}
                    {selectedElement.value && (
                      <div className="flex items-center">
                        <span className="text-muted-foreground mr-2">值:</span>
                        <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-xs">{selectedElement.value}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <Card className="border-muted/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="bg-primary/10 p-1.5 rounded-md">
                  <Settings className="h-5 w-5 text-primary" />
                </span>
                操作设置
              </CardTitle>
              <CardDescription>
                {isMultiStep ? "配置脚本步骤的操作" : "对选定的元素执行操作"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 操作类型选择 */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">操作类型</label>
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择操作" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="click">
                        <div className="flex items-center">
                          <MousePointerClick className="h-4 w-4 mr-2 text-primary" />
                          <span>点击</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="hover">
                        <div className="flex items-center">
                          <MousePointer className="h-4 w-4 mr-2 text-primary" />
                          <span>悬停</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="focus">
                        <div className="flex items-center">
                          <EyeIcon className="h-4 w-4 mr-2 text-primary" />
                          <span>焦点</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="get_text">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-primary" />
                          <span>获取文本</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="input_text">
                        <div className="flex items-center">
                          <Type className="h-4 w-4 mr-2 text-primary" />
                          <span>输入文本</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="key_press">
                        <div className="flex items-center">
                          <Keyboard className="h-4 w-4 mr-2 text-primary" />
                          <span>按键</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="double_click">
                        <div className="flex items-center">
                          <MousePointerClick className="h-4 w-4 mr-2 text-primary" />
                          <span>双击</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="right_click">
                        <div className="flex items-center">
                          <MousePointerClick className="h-4 w-4 mr-2 text-primary" />
                          <span>右键点击</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="launch_app">
                        <div className="flex items-center">
                          <AppWindow className="h-4 w-4 mr-2 text-primary" />
                          <span>启动应用</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 当操作为input_text时显示文本输入框 */}
                {selectedAction === "input_text" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="text-sm font-medium mb-2 block text-muted-foreground">要输入的文本</label>
                    <Input
                      placeholder="输入要插入的文本"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                  </motion.div>
                )}

                {/* 当操作为key_press时显示按键输入框 */}
                {selectedAction === "key_press" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="text-sm font-medium mb-2 block text-muted-foreground">按键</label>
                    <Input
                      placeholder="例如: return, escape, space"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                  </motion.div>
                )}

                {/* 多步骤脚本特有的字段 */}
                {isMultiStep && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 pt-2"
                  >
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">步骤名称</label>
                      <Input
                        placeholder="为这个步骤命名（可选）"
                        value={currentStepName}
                        onChange={(e) => setCurrentStepName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">等待时间（毫秒）</label>
                      <Input
                        type="number"
                        placeholder="操作后等待的时间（毫秒）"
                        value={waitTime || ""}
                        onChange={(e) => setWaitTime(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <Button 
                      onClick={addScriptStep}
                      disabled={isBusy}
                      className="w-full relative overflow-hidden group"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      <Plus className="h-4 w-4 mr-2" />
                      添加此步骤到脚本
                    </Button>
                  </motion.div>
                )}

                {/* 单步骤脚本的操作按钮 */}
                {!isMultiStep && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                      <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center h-20 p-2 w-full bg-gradient-to-b from-background to-muted/30 hover:from-primary/5 hover:to-primary/10"
                        onClick={() => performAction("click")}
                        disabled={isBusy || !selectorValue}
                      >
                        <MousePointerClick className="h-6 w-6 mb-1 text-primary/80" />
                        <span className="text-xs">点击</span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                      <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center h-20 p-2 w-full bg-gradient-to-b from-background to-muted/30 hover:from-primary/5 hover:to-primary/10"
                        onClick={() => performAction("input_text")}
                        disabled={isBusy || !selectorValue || !inputText}
                      >
                        <Type className="h-6 w-6 mb-1 text-primary/80" />
                        <span className="text-xs">输入文本</span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                      <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center h-20 p-2 w-full bg-gradient-to-b from-background to-muted/30 hover:from-primary/5 hover:to-primary/10"
                        onClick={() => performAction("key_press")}
                        disabled={isBusy || !inputText}
                      >
                        <Keyboard className="h-6 w-6 mb-1 text-primary/80" />
                        <span className="text-xs">按键</span>
                      </Button>
                    </motion.div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 多步骤脚本的步骤列表 */}
          {isMultiStep && scriptSteps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-muted/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span className="bg-primary/10 p-1.5 rounded-md">
                      <Layers className="h-5 w-5 text-primary" />
                    </span>
                    脚本步骤
                  </CardTitle>
                  <CardDescription>已添加的自动化步骤</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={multiStepMode} onValueChange={(v) => setMultiStepMode(v as any)}>
                    <TabsList className="grid grid-cols-2 mb-4 w-full">
                      <TabsTrigger value="list" className="data-[state=active]:bg-primary/10">列表视图</TabsTrigger>
                      <TabsTrigger value="json" className="data-[state=active]:bg-primary/10">JSON 视图</TabsTrigger>
                    </TabsList>
                    <TabsContent value="list">
                      <ScrollArea className="h-[300px] rounded-md border border-muted/40 p-4">
                        <div className="space-y-3">
                          {scriptSteps.map((step, index) => (
                            <motion.div 
                              key={index}
                              className="p-3 rounded-md bg-muted/30 backdrop-blur-sm border border-muted/40 relative overflow-hidden"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <div className="absolute h-full w-1 bg-primary/20 left-0 top-0"></div>
                              <div className="font-medium flex items-center">
                                <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5 mr-2">
                                  {index + 1}
                                </span>
                                {step.name || `步骤 ${index + 1}`}
                              </div>
                              <div className="text-xs mt-2 flex flex-wrap gap-2">
                                <span className="inline-block bg-accent text-accent-foreground px-2 py-1 rounded-md">
                                  {step.action}
                                </span>
                                <span className="inline-block bg-muted/50 text-muted-foreground px-2 py-1 rounded-md">
                                  应用: {step.app}
                                </span>
                                {step.selector && (
                                  <span className="inline-block bg-muted/50 text-muted-foreground px-2 py-1 rounded-md">
                                    选择器: {step.selector.type_}={step.selector.value}
                                  </span>
                                )}
                                {step.text && (
                                  <span className="inline-block bg-muted/50 text-muted-foreground px-2 py-1 rounded-md">
                                    文本: {step.text}
                                  </span>
                                )}
                                {step.wait && (
                                  <span className="inline-block bg-muted/50 text-muted-foreground px-2 py-1 rounded-md">
                                    等待: {step.wait}ms
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="json">
                      <div className="relative">
                        <Textarea 
                          className="font-mono text-sm h-[300px] resize-none bg-muted/10 border-muted/40"
                          value={jsonScript}
                          onChange={(e) => setJsonScript(e.target.value)}
                        />
                        <div className="absolute bottom-3 right-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={updateStepsFromJson}
                            className="bg-muted/50 backdrop-blur-sm border-muted/40 text-xs hover:bg-primary/10"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            更新步骤
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Button 
              variant="default" 
              className="w-full relative overflow-hidden group"
              onClick={saveAutomationScript}
              disabled={isBusy || (!isMultiStep && !selectorValue) || (isMultiStep && scriptSteps.length === 0)}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
              {isBusy ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              保存自动化脚本
            </Button>
          </motion.div>

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
      </div>
    </motion.div>
  );
} 
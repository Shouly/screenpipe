"use client";

import { useState, useEffect } from "react";
import { DatePicker } from "@/components/app-usage/date-picker";
import { UsageOverview } from "@/components/app-usage/usage-overview";
import { DailyUsageChart } from "@/components/app-usage/daily-usage-chart";
import { HourlyUsageChart } from "@/components/app-usage/hourly-usage-chart";
import { AppList } from "@/components/app-usage/app-list";
import { AppUsageData } from "@/lib/types";
import { 
  Loader2, 
  BarChart2, 
  Clock, 
  Smartphone, 
  Users, 
  User, 
  Building2, 
  Filter,
  Download,
  AlertTriangle,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 模拟的部门数据
const DEPARTMENTS = [
  { id: "all", name: "全部部门" },
  { id: "engineering", name: "研发部" },
  { id: "product", name: "产品部" },
  { id: "design", name: "设计部" },
  { id: "marketing", name: "市场部" },
  { id: "sales", name: "销售部" },
  { id: "hr", name: "人力资源部" }
];

// 模拟的员工数据
const EMPLOYEES = [
  { id: 1, name: "张三", department: "engineering", avatar: "/avatars/01.png", productivity: 78, activeTime: 412, topApp: "Visual Studio Code" },
  { id: 2, name: "李四", department: "engineering", avatar: "/avatars/02.png", productivity: 92, activeTime: 386, topApp: "IntelliJ IDEA" },
  { id: 3, name: "王五", department: "product", avatar: "/avatars/03.png", productivity: 65, activeTime: 310, topApp: "Figma" },
  { id: 4, name: "赵六", department: "design", avatar: "/avatars/04.png", productivity: 88, activeTime: 356, topApp: "Photoshop" },
  { id: 5, name: "钱七", department: "marketing", avatar: "/avatars/05.png", productivity: 71, activeTime: 290, topApp: "PowerPoint" },
  { id: 6, name: "孙八", department: "sales", avatar: "/avatars/06.png", productivity: 83, activeTime: 325, topApp: "Excel" },
  { id: 7, name: "周九", department: "hr", avatar: "/avatars/07.png", productivity: 76, activeTime: 275, topApp: "钉钉" },
  { id: 8, name: "吴十", department: "engineering", avatar: "/avatars/08.png", productivity: 94, activeTime: 405, topApp: "Cursor" },
];

// 模拟的异常行为数据
const ALERTS = [
  { id: 1, employeeId: 3, type: "non-work-app", message: "非工作应用使用时间过长", time: "10:30", app: "抖音" },
  { id: 2, employeeId: 5, type: "idle", message: "长时间无活动", time: "14:15-15:30", duration: 75 },
  { id: 3, employeeId: 7, type: "late", message: "今日工作开始时间晚于预期", time: "10:05", expected: "09:00" }
];

// 效率指数计算方法说明
const PRODUCTIVITY_CALCULATION = `
效率指数计算方法:
1. 生产力应用使用时间占比 (60%)
2. 工作时间规律性 (20%)
3. 专注度指标 (应用切换频率) (20%)

最终得分为0-100的百分比值，80%以上为优秀。
`;

// 异常行为判断标准说明
const ALERT_CRITERIA = `
异常行为判断标准:
1. 非工作应用使用: 单个非工作应用使用超过30分钟
2. 长时间无活动: 工作时间内连续无操作超过60分钟
3. 工作时间异常: 首次活动晚于预期开始时间1小时以上
4. 频繁应用切换: 5分钟内应用切换次数超过20次
5. 工作时间过短: 全天活跃时间少于预期工作时间的70%

系统会根据团队设置的标准自动识别异常行为。
`;

export default function AppUsagePage() {
  const [date, setDate] = useState(new Date());
  const [data, setData] = useState<AppUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedView, setSelectedView] = useState("team");
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 确保使用本地日期，避免时区问题
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        console.log("查询日期:", dateStr); // 添加日志以便调试
        const response = await fetch(`/api/app-usage?date=${dateStr}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setData(data);
      } catch (error) {
        console.error("Error fetching app usage data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [date]);
  
  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
  };

  // 根据部门筛选员工
  const filteredEmployees = EMPLOYEES.filter(
    employee => selectedDepartment === "all" || employee.department === selectedDepartment
  );

  // 获取选中员工的数据
  const selectedEmployeeData = selectedEmployee 
    ? EMPLOYEES.find(emp => emp.id === selectedEmployee) 
    : null;

  // 获取部门的异常警报数量
  const getAlertCountByDepartment = (departmentId: string) => {
    if (departmentId === "all") {
      return ALERTS.length;
    }
    
    const departmentEmployeeIds = EMPLOYEES
      .filter(emp => emp.department === departmentId)
      .map(emp => emp.id);
      
    return ALERTS.filter(alert => departmentEmployeeIds.includes(alert.employeeId)).length;
  };
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">团队工作洞察</h1>
          <p className="text-gray-500 mt-1">助力团队提升效率，优化工作体验</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择部门" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <DatePicker date={date} onDateChange={handleDateChange} />
          
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Filter className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="team" value={selectedView} onValueChange={setSelectedView} className="mb-6">
        <TabsList className="grid w-full md:w-[400px] grid-cols-3">
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            团队概览
          </TabsTrigger>
          <TabsTrigger value="employees">
            <User className="h-4 w-4 mr-2" />
            员工列表
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Building2 className="h-4 w-4 mr-2" />
            部门分析
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-gray-950 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500">加载数据中...</p>
        </div>
      ) : data ? (
        <>
          {/* 团队概览视图 */}
          {selectedView === "team" && (
            <div className="grid grid-cols-1 gap-6">
              {/* 顶部卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">总活跃时间</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.totalUsageMinutes} 分钟</div>
                    <p className="text-xs text-green-600 mt-1">↑ 12% 相比上周</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                      平均效率指数
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 p-0">
                              <Info className="h-3.5 w-3.5 text-gray-400" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs whitespace-pre-line">{PRODUCTIVITY_CALCULATION}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">78%</div>
                    <p className="text-xs text-red-600 mt-1">↓ 3% 相比上周</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                      异常行为
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 p-0">
                              <Info className="h-3.5 w-3.5 text-gray-400" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs whitespace-pre-line">{ALERT_CRITERIA}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{ALERTS.length}</div>
                    <p className="text-xs text-yellow-600 mt-1">需要关注 {ALERTS.length} 个问题</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* 主要图表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>部门活跃度对比</CardTitle>
                    <CardDescription>各部门平均工作时间与效率</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <DailyUsageChart data={data} />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>工作时段分布</CardTitle>
                    <CardDescription>团队成员活跃时间分布</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <HourlyUsageChart data={data} />
                  </CardContent>
                </Card>
              </div>
              
              {/* 应用使用情况 */}
              <Card>
                <CardHeader>
                  <CardTitle>团队应用使用情况</CardTitle>
                  <CardDescription>按使用时长排序</CardDescription>
                </CardHeader>
                <CardContent>
                  <AppList data={data} />
                </CardContent>
              </Card>
              
              {/* 异常行为列表 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                    <CardTitle>需要关注的异常行为</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 p-0">
                            <Info className="h-3.5 w-3.5 text-gray-400" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs whitespace-pre-line">{ALERT_CRITERIA}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <CardDescription>今日检测到的异常活动</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ALERTS.map(alert => {
                      const employee = EMPLOYEES.find(emp => emp.id === alert.employeeId);
                      return (
                        <div key={alert.id} className="flex items-start p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden mr-3">
                            {employee?.avatar && (
                              <img src={employee.avatar} alt={employee.name} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{employee?.name}</div>
                            <div className="text-sm text-gray-500">{alert.message}</div>
                            <div className="text-xs text-gray-400 mt-1">时间: {alert.time}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* 员工列表视图 */}
          {selectedView === "employees" && (
            <div className="grid grid-cols-1 gap-6">
              {selectedEmployee ? (
                // 单个员工详情视图
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      onClick={() => setSelectedEmployee(null)}
                      className="mr-4"
                    >
                      ← 返回列表
                    </Button>
                    
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden mr-4">
                        {selectedEmployeeData?.avatar && (
                          <img 
                            src={selectedEmployeeData.avatar} 
                            alt={selectedEmployeeData.name} 
                            className="h-full w-full object-cover" 
                          />
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedEmployeeData?.name}</h2>
                        <p className="text-gray-500">
                          {DEPARTMENTS.find(d => d.id === selectedEmployeeData?.department)?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 员工概览卡片 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">今日活跃时间</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedEmployeeData?.activeTime} 分钟</div>
                        <p className="text-xs text-green-600 mt-1">↑ 8% 相比昨天</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                          效率指数
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 p-0">
                                  <Info className="h-3.5 w-3.5 text-gray-400" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs whitespace-pre-line">{PRODUCTIVITY_CALCULATION}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedEmployeeData?.productivity}%</div>
                        <p className="text-xs text-green-600 mt-1">↑ 5% 相比昨天</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">最常用应用</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedEmployeeData?.topApp}</div>
                        <p className="text-xs text-gray-500 mt-1">占比 42%</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                          异常行为
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 p-0">
                                  <Info className="h-3.5 w-3.5 text-gray-400" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs whitespace-pre-line">{ALERT_CRITERIA}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {ALERTS.filter(a => a.employeeId === selectedEmployee).length}
                        </div>
                        <p className="text-xs text-yellow-600 mt-1">
                          {ALERTS.filter(a => a.employeeId === selectedEmployee).length > 0 
                            ? "需要关注" 
                            : "一切正常"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* 员工详细图表 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>活跃度趋势</CardTitle>
                        <CardDescription>过去7天的工作时间</CardDescription>
                      </CardHeader>
                      <CardContent className="h-80">
                        <DailyUsageChart data={data} />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>今日工作时段</CardTitle>
                        <CardDescription>按小时统计的活跃度</CardDescription>
                      </CardHeader>
                      <CardContent className="h-80">
                        <HourlyUsageChart data={data} />
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* 应用使用详情 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>应用使用详情</CardTitle>
                      <CardDescription>按使用时长排序</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AppList data={data} />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                // 员工列表
                <Card>
                  <CardHeader>
                    <CardTitle>员工活动列表</CardTitle>
                    <CardDescription>
                      {selectedDepartment === "all" 
                        ? "所有部门员工" 
                        : DEPARTMENTS.find(d => d.id === selectedDepartment)?.name + "员工"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {filteredEmployees.map(employee => (
                        <div 
                          key={employee.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                          onClick={() => setSelectedEmployee(employee.id)}
                        >
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden mr-3">
                              {employee.avatar && (
                                <img src={employee.avatar} alt={employee.name} className="h-full w-full object-cover" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{employee.name}</div>
                              <div className="text-sm text-gray-500">
                                {DEPARTMENTS.find(d => d.id === employee.department)?.name}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <div className="text-sm font-medium">{employee.activeTime} 分钟</div>
                              <div className="text-xs text-gray-500">活跃时间</div>
                            </div>
                            
                            <div className="text-right">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <div className="text-sm font-medium">{employee.productivity}%</div>
                                      <div className="text-xs text-gray-500">效率指数</div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="text-xs whitespace-pre-line">{PRODUCTIVITY_CALCULATION}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-sm font-medium">{employee.topApp}</div>
                              <div className="text-xs text-gray-500">主要应用</div>
                            </div>
                            
                            {ALERTS.some(alert => alert.employeeId === employee.id) && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-yellow-100 text-yellow-600">
                                      <AlertTriangle className="h-4 w-4" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="text-xs">
                                      {ALERTS.filter(a => a.employeeId === employee.id).map(a => a.message).join(', ')}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          {/* 部门分析视图 */}
          {selectedView === "departments" && (
            <div className="grid grid-cols-1 gap-6">
              {/* 部门卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DEPARTMENTS.filter(dept => dept.id !== "all").map(dept => (
                  <Card key={dept.id} className="cursor-pointer hover:border-blue-500 transition-colors">
                    <CardHeader>
                      <CardTitle>{dept.name}</CardTitle>
                      <CardDescription>
                        {EMPLOYEES.filter(emp => emp.department === dept.id).length} 名员工
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">平均活跃时间</span>
                          <span className="font-medium">
                            {Math.round(
                              EMPLOYEES.filter(emp => emp.department === dept.id)
                                .reduce((sum, emp) => sum + emp.activeTime, 0) / 
                              EMPLOYEES.filter(emp => emp.department === dept.id).length
                            )} 分钟
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500 flex items-center">
                            平均效率指数
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 p-0">
                                    <Info className="h-3.5 w-3.5 text-gray-400" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs whitespace-pre-line">{PRODUCTIVITY_CALCULATION}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </span>
                          <span className="font-medium">
                            {Math.round(
                              EMPLOYEES.filter(emp => emp.department === dept.id)
                                .reduce((sum, emp) => sum + emp.productivity, 0) / 
                              EMPLOYEES.filter(emp => emp.department === dept.id).length
                            )}%
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500 flex items-center">
                            异常行为
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 p-0">
                                    <Info className="h-3.5 w-3.5 text-gray-400" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs whitespace-pre-line">{ALERT_CRITERIA}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </span>
                          <span className="font-medium">
                            {getAlertCountByDepartment(dept.id)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* 部门对比图表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>部门效率对比</CardTitle>
                    <CardDescription>各部门平均效率指数</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <DailyUsageChart data={data} />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>部门活跃时间对比</CardTitle>
                    <CardDescription>各部门平均活跃时间</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <HourlyUsageChart data={data} />
                  </CardContent>
                </Card>
              </div>
              
              {/* 部门应用使用情况 */}
              <Card>
                <CardHeader>
                  <CardTitle>各部门常用应用</CardTitle>
                  <CardDescription>按部门统计的应用使用情况</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {DEPARTMENTS.filter(dept => dept.id !== "all").map(dept => (
                      <div key={dept.id}>
                        <h3 className="font-medium mb-2">{dept.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {["Visual Studio Code", "钉钉", "Chrome"].map(app => (
                            <div key={app} className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                              <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-800 mr-3 flex items-center justify-center">
                                <Smartphone className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-medium">{app}</div>
                                <div className="text-xs text-gray-500">平均 {Math.floor(Math.random() * 120) + 30} 分钟/天</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-gray-950 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 text-lg">无法加载数据</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            onClick={() => handleDateChange(new Date())}
          >
            重试
          </button>
        </div>
      )}
    </div>
  );
} 
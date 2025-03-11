"use client"

import { DailyUsageBarChart } from "@/components/charts/app-usage-bar-chart"
import { AppUsagePieChart } from "@/components/charts/app-usage-pie-chart"
import { HourlyAppUsageChart } from "@/components/charts/hourly-app-usage-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppUsageApi, DailyAppUsage, HourlyAppUsageSummary, ProductivitySummary } from '@/lib/app-usage-api'
import { formatMinutes, formatTimeSpent } from "@/lib/utils"
import { addDays, format, subDays } from "date-fns"
import { ChevronLeft, ChevronRight, Clock, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"

export default function AppUsagePage() {
  const today = new Date()
  const yesterday = subDays(today, 1)

  // 状态管理
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: today,
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // 数据状态
  const [productivitySummary, setProductivitySummary] = useState<ProductivitySummary | null>(null)
  const [dailyUsage, setDailyUsage] = useState<DailyAppUsage[]>([])
  const [hourlyAppData, setHourlyAppData] = useState<HourlyAppUsageSummary[]>([])
  const [weeklyData, setWeeklyData] = useState<any[]>([])

  // 获取数据的函数
  const fetchData = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    setIsLoading(true)
    try {
      // 获取生产力摘要
      const startDateStr = format(dateRange.from, 'yyyy-MM-dd')
      const endDateStr = format(dateRange.to, 'yyyy-MM-dd')

      // 使用API获取生产力摘要
      try {
        console.log('正在获取生产力摘要，日期范围:', startDateStr, '至', endDateStr)
        const summaryData = await AppUsageApi.getProductivitySummary(startDateStr, endDateStr)
        console.log('成功获取生产力摘要:', summaryData)
        setProductivitySummary(summaryData)
      } catch (error) {
        console.error('获取生产力摘要失败:', error)
      }

      // 使用API获取每日应用使用情况
      try {
        console.log('正在获取每日应用使用情况，日期范围:', startDateStr, '至', endDateStr)
        const dailyData = await AppUsageApi.getDailyAppUsage(startDateStr, endDateStr)
        console.log('成功获取每日应用使用情况:', dailyData.length, '条记录')
        setDailyUsage(dailyData)
      } catch (error) {
        console.error('获取每日应用使用情况失败:', error)
      }

      // 使用API函数获取按应用分组的小时数据
      try {
        console.log('正在获取按应用分组的小时数据，日期:', startDateStr)
        const hourlyAppData = await AppUsageApi.getHourlyAppUsage(startDateStr)
        console.log('成功获取按应用分组的小时数据:', hourlyAppData.length, '条记录')
        setHourlyAppData(hourlyAppData)
      } catch (error) {
        console.error('获取按应用分组的小时数据失败:', error)
      }

      // 获取周数据（过去7天）
      await fetchWeeklyData()
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 获取周数据
  const fetchWeeklyData = async () => {
    if (!dateRange?.from) return

    try {
      const endDate = dateRange.from
      const startDate = subDays(endDate, 6)
      const startDateStr = format(startDate, 'yyyy-MM-dd')
      const endDateStr = format(endDate, 'yyyy-MM-dd')

      // 使用API获取过去7天的每日应用使用情况
      try {
        console.log('正在获取周数据，日期范围:', startDateStr, '至', endDateStr)
        const weeklyData = await AppUsageApi.getDailyAppUsage(startDateStr, endDateStr)
        console.log('成功获取周数据:', weeklyData.length, '条记录')

        // 处理周数据
        const weekDays = ['日', '一', '二', '三', '四', '五', '六']
        const processedData = []

        // 按日期分组并计算总时间
        const groupedByDate = weeklyData.reduce((acc: any, item: DailyAppUsage) => {
          const date = item.date
          if (!acc[date]) {
            acc[date] = 0
          }
          acc[date] += item.total_minutes
          return acc
        }, {})

        // 转换为图表数据格式
        for (let i = 0; i < 7; i++) {
          const date = format(subDays(endDate, 6 - i), 'yyyy-MM-dd')
          const dayOfWeek = new Date(date).getDay()
          const hours = (groupedByDate[date] || 0) / 60

          processedData.push({
            day: weekDays[dayOfWeek],
            hours: parseFloat(hours.toFixed(1))
          })
        }

        setWeeklyData(processedData)
      } catch (error) {
        console.error('获取周数据失败:', error)
      }
    } catch (error) {
      console.error('处理周数据失败:', error)
    }
  }

  // 日期变更处理
  const handleDateChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange)
  }

  // 日期导航
  const handlePrevDay = () => {
    if (dateRange?.from) {
      const prevDay = subDays(dateRange.from, 1)
      setDateRange({
        from: prevDay,
        to: prevDay
      })
    }
  }

  const handleNextDay = () => {
    if (dateRange?.from) {
      const nextDay = addDays(dateRange.from, 1)
      const today = new Date()

      // 不允许选择未来日期
      if (nextDay <= today) {
        setDateRange({
          from: nextDay,
          to: nextDay
        })
      }
    }
  }

  // 过滤应用列表
  const getFilteredApps = () => {
    if (!dailyUsage) return []

    // 按应用名称分组
    const appGroups = dailyUsage.reduce((acc: any, item: DailyAppUsage) => {
      const key = item.app_name
      if (!acc[key]) {
        acc[key] = {
          app_name: item.app_name,
          category_id: item.category_id,
          category_name: item.category_name,
          productivity_type: item.productivity_type,
          total_minutes: 0
        }
      }
      acc[key].total_minutes += item.total_minutes
      return acc
    }, {})

    // 转换为数组并计算百分比
    let apps = Object.values(appGroups)
    const totalMinutes = apps.reduce((sum: number, app: any) => sum + app.total_minutes, 0)

    apps = apps.map((app: any) => ({
      ...app,
      total_time_seconds: Math.round(app.total_minutes * 60),
      percentage: (app.total_minutes / totalMinutes) * 100
    }))

    // 应用搜索过滤
    if (searchTerm) {
      apps = apps.filter((app: any) =>
        app.app_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 按标签过滤
    if (activeTab === "productive") {
      apps = apps.filter((app: any) => app.productivity_type === "PRODUCTIVE")
    } else if (activeTab === "neutral") {
      apps = apps.filter((app: any) => app.productivity_type === "NEUTRAL")
    } else if (activeTab === "distracting") {
      apps = apps.filter((app: any) => app.productivity_type === "DISTRACTING")
    }

    // 按使用时间排序
    return apps.sort((a: any, b: any) => b.total_minutes - a.total_minutes)
  }

  // 准备饼图数据
  const getPieChartData = () => {
    if (!productivitySummary) return []

    return [
      { name: "生产型应用", value: Math.round(productivitySummary.productive_minutes * 60), color: "#22c55e" },
      { name: "中性应用", value: Math.round(productivitySummary.neutral_minutes * 60), color: "#3b82f6" },
      { name: "干扰型应用", value: Math.round(productivitySummary.distracting_minutes * 60), color: "#ef4444" }
    ]
  }

  // 数据加载
  useEffect(() => {
    fetchData()
  }, [dateRange])

  // 确保组件加载时立即获取数据
  useEffect(() => {
    // 组件首次加载时，确保数据被获取
    if (!isLoading && !productivitySummary) {
      fetchData()
    }
  }, [])

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 p-4 rounded-lg border shadow-sm">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">应用使用分析</h1>
            <p className="text-muted-foreground flex items-center">
              {isLoading ? (
                <span className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-2"></span>
                  数据加载中...
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  {format(new Date(), 'yyyy-MM-dd HH:mm')} 更新
                  {dateRange?.from && dateRange.from.toDateString() === new Date().toDateString() && (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                      显示今天数据
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevDay}
                className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="relative">
                <Select
                  value={dateRange?.from?.toISOString()}
                  onValueChange={(value) => {
                    const date = new Date(value)
                    handleDateChange({ from: date, to: date })
                  }}
                >
                  <SelectTrigger className="w-[160px] h-10 border rounded-md bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
                    <SelectValue>
                      {dateRange?.from ? (
                        dateRange.from.toDateString() === new Date().toDateString()
                          ? <span className="flex items-center font-medium text-green-600 dark:text-green-400">
                            <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                            今天
                          </span>
                          : dateRange.from.toDateString() === yesterday.toDateString()
                            ? "昨天"
                            : format(dateRange.from, "yyyy年M月d日")
                      ) : "选择日期"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={new Date().toISOString()} className="font-medium text-green-600 dark:text-green-400">
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                        今天
                      </div>
                    </SelectItem>
                    <SelectItem value={yesterday.toISOString()}>昨天</SelectItem>
                    <SelectItem value={subDays(new Date(), 2).toISOString()}>前天</SelectItem>
                    <div className="px-2 py-1.5 border-t">
                      <DateRangePicker
                        value={dateRange}
                        onChange={handleDateChange}
                        className="w-auto"
                        singleDay={true}
                      />
                    </div>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextDay}
                className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled={dateRange?.from && dateRange.from.toDateString() === new Date().toDateString()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 概览统计卡片 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今日活跃时间</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {productivitySummary ? formatMinutes(productivitySummary.total_minutes) : '0分钟'}
              </div>
              {productivitySummary?.total_minutes_change_percentage !== undefined && (
                <p className={`text-xs ${productivitySummary.total_minutes_change_percentage >= 0 ? 'text-green-500' : 'text-amber-500'} mt-1 flex items-center`}>
                  {productivitySummary.total_minutes_change_percentage >= 0 ? '↑' : '↓'} {Math.abs(productivitySummary.total_minutes_change_percentage)}% 相比昨天
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">效率指数</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {productivitySummary ? Math.round(productivitySummary.productive_percentage) : 0}%
              </div>
              {productivitySummary?.productive_percentage_change !== undefined && (
                <p className={`text-xs ${productivitySummary.productive_percentage_change >= 0 ? 'text-green-500' : 'text-amber-500'} mt-1 flex items-center`}>
                  {productivitySummary.productive_percentage_change >= 0 ? '↑' : '↓'} {Math.abs(productivitySummary.productive_percentage_change)}% 相比昨天
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最常用应用</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {productivitySummary?.most_used_app || (dailyUsage.length > 0 ? dailyUsage[0].app_name : "Visual Studio Code")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                占比 {productivitySummary?.most_used_app_percentage || (dailyUsage.length > 0 ? Math.round((dailyUsage[0].total_minutes / (productivitySummary?.total_minutes || 1)) * 100) : 42)}%
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">异常行为</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {productivitySummary?.anomaly_count !== undefined ? productivitySummary.anomaly_count : 0}
              </div>
              <p className="text-xs text-amber-500 mt-1">
                {productivitySummary?.anomaly_description || "一切正常"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 每小时使用图表*/}
        <Card className="border shadow-sm bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">每小时使用分布</CardTitle>
                <CardDescription className="mt-1">
                  一天中不同时段的应用使用情况，了解您的工作和休息模式
                </CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">显示前6个使用最多的应用</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <HourlyAppUsageChart data={hourlyAppData} height={350} maxApps={6} />
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm rounded-md transition-all"
            >
              概览
            </TabsTrigger>
            <TabsTrigger
              value="productive"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 rounded-md transition-all"
            >
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                生产型
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="neutral"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 rounded-md transition-all"
            >
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
                中性
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="distracting"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 rounded-md transition-all"
            >
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
                干扰型
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* 每日使用图表 */}
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle>每日使用时间</CardTitle>
                  <CardDescription>
                    过去一周的应用使用时间分布
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DailyUsageBarChart data={weeklyData} height={250} />
                </CardContent>
              </Card>

              {/* 应用类别分布 */}
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle>应用类别分布</CardTitle>
                  <CardDescription>
                    按生产力类型划分的使用时间
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AppUsagePieChart
                    data={getPieChartData()}
                    totalTime={productivitySummary ? Math.round(productivitySummary.total_minutes * 60) : 0}
                    height={250}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {["overview", "productive", "neutral", "distracting"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              <Card className="border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>
                      {tab === "overview" ? "所有应用" :
                        tab === "productive" ? "生产型应用" :
                          tab === "neutral" ? "中性应用" : "干扰型应用"}
                    </CardTitle>
                    <CardDescription>
                      {tab === "overview" ? "所有应用的使用情况" :
                        tab === "productive" ? "提高工作效率的应用" :
                          tab === "neutral" ? "工作辅助类应用" : "可能分散注意力的应用"}
                    </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Input
                      type="text"
                      placeholder="搜索应用..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 rounded-full border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-offset-0"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-800">
                          <th className="text-left py-3 font-medium text-muted-foreground text-sm">应用</th>
                          <th className="text-left py-3 font-medium text-muted-foreground text-sm">使用时间</th>
                          <th className="text-left py-3 font-medium text-muted-foreground text-sm">占比</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredApps().map((app: any, index: number) => (
                          <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                            <td className="py-4 flex items-center">
                              <div className={`w-10 h-10 rounded-md shadow-sm flex items-center justify-center text-white mr-3 ${app.productivity_type === "PRODUCTIVE" ? "bg-gradient-to-br from-green-400 to-green-600" :
                                app.productivity_type === "DISTRACTING" ? "bg-gradient-to-br from-red-400 to-red-600" :
                                  "bg-gradient-to-br from-blue-400 to-blue-600"
                                }`}>
                                {app.app_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">{app.app_name}</div>
                                <div className="text-xs text-muted-foreground flex items-center mt-1">
                                  <span className={`inline-block w-2 h-2 rounded-full mr-1 ${app.productivity_type === "PRODUCTIVE" ? "bg-green-500" :
                                    app.productivity_type === "DISTRACTING" ? "bg-red-500" : "bg-blue-500"
                                    }`}></span>
                                  {app.category_name || (
                                    app.productivity_type === "PRODUCTIVE" ? "生产型" :
                                      app.productivity_type === "NEUTRAL" ? "中性" : "干扰型"
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 font-medium">{formatTimeSpent(app.total_time_seconds)}</td>
                            <td className="py-4">
                              <div className="flex items-center">
                                <div className="w-24 h-2 bg-gray-100 dark:bg-gray-800 rounded-full mr-2 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${app.productivity_type === "PRODUCTIVE" ? "bg-green-500" :
                                      app.productivity_type === "DISTRACTING" ? "bg-red-500" : "bg-blue-500"
                                      }`}
                                    style={{ width: `${app.percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm">{app.percentage.toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
} 
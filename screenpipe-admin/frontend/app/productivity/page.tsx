import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader, PageHeaderActions } from "@/components/layout/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, BarChart2, Download, Filter, LineChart, PieChart, Plus, Users } from "lucide-react"
import Link from "next/link"

export default function ProductivityPage() {
  return (
    <div className="container py-8">
      <PageHeader 
        title="生产力分析" 
        description="全面了解员工使用的应用程序和工具，优化工作流程，提高团队效率"
      >
        <PageHeaderActions>
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="mr-2 h-4 w-4" />
            筛选
          </Button>
          <Button variant="outline" size="sm" className="h-9">
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
          <Button size="sm" className="h-9">
            <Plus className="mr-2 h-4 w-4" />
            新建报告
          </Button>
        </PageHeaderActions>
      </PageHeader>
      
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="app-usage">应用使用</TabsTrigger>
          <TabsTrigger value="team-comparison">团队对比</TabsTrigger>
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {analysisCards.map((card, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-md bg-primary/10">
                      {card.icon}
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-xl">{card.title}</CardTitle>
                  <CardDescription>
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {card.content}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="ghost" className="w-full justify-between">
                    <Link href={card.link} className="flex items-center">
                      查看详情
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="app-usage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>应用使用分析</CardTitle>
              <CardDescription>
                查看员工使用各类应用的时间分布
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md bg-muted/30">
                <p className="text-muted-foreground">应用使用数据图表</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="team-comparison" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>团队对比分析</CardTitle>
              <CardDescription>
                比较不同团队的应用使用情况
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md bg-muted/30">
                <p className="text-muted-foreground">团队对比数据图表</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="trends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>趋势分析</CardTitle>
              <CardDescription>
                查看应用使用的长期变化趋势
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md bg-muted/30">
                <p className="text-muted-foreground">趋势分析数据图表</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>应用使用分析平台</CardTitle>
            <CardDescription>
              全面了解员工应用使用习惯
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                我们的应用使用分析平台提供了全面的工具，帮助您了解员工的应用使用习惯。通过收集和分析员工在不同应用上花费的时间，我们可以帮助您：
              </p>
              
              <ul className="list-disc pl-6 space-y-2">
                <li>识别最常用的应用程序和工具</li>
                <li>优化软件许可证分配，确保资源得到充分利用</li>
                <li>了解员工的应用使用模式和趋势</li>
                <li>提供数据支持的改进建议，提高整体工作效率</li>
                <li>帮助员工更好地使用应用工具，提高工作满意度</li>
              </ul>
              
              <p>
                通过我们的平台，您可以获取实时数据和深入分析，做出更明智的决策，提高团队的效率。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const analysisCards = [
  {
    icon: <BarChart2 className="h-5 w-5 text-primary" />,
    title: "应用使用分析",
    description: "监控软件使用情况",
    content: "追踪员工使用各类应用的时间，识别高效工具和潜在的时间浪费源。",
    link: "/productivity/app-usage"
  },
  {
    icon: <LineChart className="h-5 w-5 text-primary" />,
    title: "趋势分析",
    description: "长期使用变化",
    content: "追踪团队和个人应用使用的长期变化趋势，评估管理决策和工作环境变化的影响。",
    link: "/productivity/trends"
  },
  {
    icon: <Users className="h-5 w-5 text-primary" />,
    title: "团队对比",
    description: "跨团队应用使用比较",
    content: "比较不同团队和部门的应用使用指标，识别最佳实践和改进机会。",
    link: "/productivity/team-comparison"
  }
];
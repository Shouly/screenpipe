import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight, 
  BarChart2, 
  Clock, 
  Monitor, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Zap,
  LineChart,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      {/* Hero Section - 更现代的设计 */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
        {/* 背景装饰元素 */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 right-[10%] w-64 h-64 rounded-full bg-primary/5 blur-3xl"></div>
          <div className="absolute bottom-20 left-[5%] w-72 h-72 rounded-full bg-primary/5 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/3 blur-3xl opacity-30"></div>
        </div>
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid gap-8 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-16 items-center">
            <div className="flex flex-col justify-center space-y-6">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary w-fit">
                全新升级 v2.0
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                  员工生产力<br />智能分析平台
                </h1>
                <p className="max-w-[600px] text-muted-foreground text-lg md:text-xl">
                  通过数据驱动洞察，全面监控、深入分析、优化员工工作效率，提升企业整体生产力
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <Link href="/productivity">
                  <Button size="lg" className="gap-2 w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
                    开始分析 <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto border-primary/20 hover:bg-primary/5">
                    了解更多
                  </Button>
                </Link>
              </div>
              
              {/* 信任徽章 */}
              <div className="flex items-center gap-2 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border-2 border-background">
                      <span className="text-xs font-medium">U{i}</span>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">500+</span> 企业信赖之选
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center relative">
              {/* 3D效果的图表展示 */}
              <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] perspective-1000">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[320px] md:h-[320px] rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shadow-2xl animate-slow-spin">
                  <div className="w-[220px] h-[220px] md:w-[260px] md:h-[260px] rounded-full bg-gradient-to-tr from-primary/20 to-primary/10 flex items-center justify-center backdrop-blur-sm rotate-12 animate-reverse-slow-spin">
                    <div className="w-[160px] h-[160px] md:w-[200px] md:h-[200px] rounded-full bg-gradient-to-bl from-primary/30 to-primary/20 flex items-center justify-center backdrop-blur-md -rotate-6">
                      <BarChart2 className="w-20 h-20 text-primary drop-shadow-lg" />
                    </div>
                  </div>
                </div>
                
                {/* 浮动的数据点 */}
                <div className="absolute top-[20%] right-[15%] p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg animate-float">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium">生产力提升 28%</span>
                  </div>
                </div>
                
                <div className="absolute bottom-[25%] left-[10%] p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg animate-float-delay">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-medium">团队协作优化</span>
                  </div>
                </div>
                
                <div className="absolute top-[60%] right-[5%] p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg animate-float">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-medium">节省 20% 时间</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 客户标志部分 - 新增 */}
      <section className="w-full py-12 bg-muted/30">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-xl font-medium text-muted-foreground">受到行业领先企业的信赖</h2>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {['阿里巴巴', '腾讯', '百度', '京东', '字节跳动', '华为'].map((company, index) => (
              <div key={index} className="flex items-center justify-center h-8 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                <span className="text-xl font-bold text-muted-foreground">{company}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 统计数字部分 - 改进 */}
      <section className="w-full py-16 bg-background border-y">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center text-center p-4 space-y-2">
                <div className="p-2 rounded-full bg-primary/10 mb-2">
                  {stat.icon}
                </div>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - 改进卡片设计 */}
      <section className="w-full py-16 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
              核心功能
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">全方位员工生产力分析</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              我们的平台提供多维度分析，帮助企业了解员工工作状态，优化资源配置
            </p>
          </div>
          
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="group relative overflow-hidden border-0 bg-background shadow-md hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader>
                  <div className="p-3 w-fit rounded-xl bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.content}</p>
                </CardContent>
                {feature.link && (
                  <CardFooter>
                    <Link href={feature.link} className="text-sm text-primary flex items-center group-hover:underline">
                      了解更多 <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 工作流程部分 - 改进 */}
      <section className="w-full py-16 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
              工作流程
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">如何提升团队生产力</h2>
            <p className="max-w-[700px] text-muted-foreground md:text-lg">
              简单四步，帮助您的团队实现效率最大化
            </p>
          </div>
          
          <div className="relative">
            {/* 连接线 */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary/20 hidden md:block"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative">
              {workflowSteps.map((step, index) => (
                <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'md:pr-12 md:text-right md:items-end' : 'md:pl-12'} relative`}>
                  {/* 步骤数字 - 桌面版 */}
                  <div className={`absolute top-0 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shadow-lg z-10 ${index % 2 === 0 ? 'right-[-20px]' : 'left-[-20px]'}`}>
                    {index + 1}
                  </div>
                  
                  {/* 步骤数字 - 移动版 */}
                  <div className="flex md:hidden items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold shadow-lg mb-3">
                    {index + 1}
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 客户评价部分 - 新增 */}
      <section className="w-full py-16 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
              客户评价
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">客户如何评价我们</h2>
            <p className="max-w-[700px] text-muted-foreground md:text-lg">
              来自各行业客户的真实反馈
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-muted/30 border-0">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">{testimonial.name.charAt(0)}</span>
                    </div>
                    <div>
                      <CardTitle className="text-base">{testimonial.name}</CardTitle>
                      <CardDescription>{testimonial.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground italic">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - 改进设计 */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <div className="space-y-4 max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight lg:text-5xl">
                准备好提升团队生产力了吗？
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                立即开始使用我们的员工生产力分析平台，发现优化机会，提高团队效率
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/productivity">
                <Button size="lg" className="gap-2 w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
                  开始分析 <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto border-primary/20 hover:bg-primary/5">
                  预约演示
                </Button>
              </Link>
            </div>
            
            {/* 信任徽章 */}
            <div className="flex items-center gap-2 pt-4">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">无需信用卡 · 14天免费试用 · 随时取消</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const features = [
  {
    icon: <BarChart2 className="h-5 w-5 text-primary" />,
    title: "应用使用分析",
    description: "监控软件使用情况",
    content: "追踪员工使用各类应用的时间，识别高效工具和潜在的时间浪费源。",
    link: "/productivity/app-usage"
  },
  {
    icon: <Monitor className="h-5 w-5 text-primary" />,
    title: "UI监控",
    description: "实时界面活动追踪",
    content: "监控员工界面活动，了解工作流程中的瓶颈和低效环节。",
    link: "/ui-monitoring"
  },
  {
    icon: <TrendingUp className="h-5 w-5 text-primary" />,
    title: "趋势分析",
    description: "长期使用变化",
    content: "追踪团队和个人应用使用的长期变化趋势，评估管理决策和工作环境变化的影响。"
  },
  {
    icon: <Users className="h-5 w-5 text-primary" />,
    title: "团队对比",
    description: "跨团队应用使用比较",
    content: "比较不同团队和部门的应用使用指标，识别最佳实践和改进机会。"
  }
];

// 工作流程步骤
const workflowSteps = [
  {
    title: "数据收集",
    description: "安装我们的监控工具，开始收集员工应用使用和界面活动数据。"
  },
  {
    title: "数据分析",
    description: "我们的AI算法分析收集到的数据，识别效率低下的模式和改进机会。"
  },
  {
    title: "生成洞察",
    description: "基于分析结果，生成可操作的洞察和建议，帮助优化工作流程。"
  },
  {
    title: "实施改进",
    description: "根据洞察实施改进措施，持续监控效果，不断优化团队生产力。"
  }
];

// 统计数据
const stats = [
  {
    icon: <TrendingUp className="h-5 w-5 text-primary" />,
    value: "30%",
    label: "平均效率提升"
  },
  {
    icon: <Users className="h-5 w-5 text-primary" />,
    value: "500+",
    label: "企业客户"
  },
  {
    icon: <Zap className="h-5 w-5 text-primary" />,
    value: "20%",
    label: "软件成本节约"
  },
  {
    icon: <Clock className="h-5 w-5 text-primary" />,
    value: "24/7",
    label: "实时监控"
  }
];

// 客户评价
const testimonials = [
  {
    name: "张经理",
    role: "技术总监 · 科技公司",
    content: "Time Glass帮助我们团队提高了25%的工作效率，识别了多个时间浪费点，是我们管理团队的得力助手。"
  },
  {
    name: "李总监",
    role: "运营主管 · 电商平台",
    content: "通过使用Time Glass，我们优化了团队工作流程，减少了不必要的会议和干扰，员工满意度显著提升。"
  },
  {
    name: "王总",
    role: "CEO · 创业公司",
    content: "作为一家快速成长的创业公司，Time Glass帮助我们建立了高效的工作文化，是我们不可或缺的工具。"
  }
];

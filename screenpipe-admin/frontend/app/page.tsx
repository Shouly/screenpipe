"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader, PageSection, PageGrid } from "@/components/ui/page-container";
import { useAuth } from "@/lib/auth";
import { 
  BarChart2, 
  Monitor, 
  EyeIcon, 
  LockIcon, 
  Puzzle, 
  ArrowRight, 
  ChevronRight, 
  CheckCircle,
  Users,
  Shield,
  Zap,
  Clock,
  LineChart
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  const { isAuthenticated } = useAuth();

  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  // 功能卡片数据
  const features = [
    {
      title: "生产力分析",
      description: "深入分析员工工作效率，识别时间管理问题，提供优化建议",
      icon: <BarChart2 className="h-10 w-10 text-primary" />,
      href: "/productivity",
      color: "from-primary/20 to-primary/5"
    },
    {
      title: "UI监控",
      description: "实时监控员工界面操作，确保工作专注度，提高工作质量",
      icon: <Monitor className="h-10 w-10 text-accent" />,
      href: "/ui-monitoring",
      color: "from-accent/20 to-accent/5"
    },
    {
      title: "OCR文本",
      description: "自动识别屏幕文本内容，分析工作内容，评估工作质量",
      icon: <EyeIcon className="h-10 w-10 text-blue" />,
      href: "/ocr-text",
      color: "from-blue/20 to-blue/5"
    },
    {
      title: "远程控制",
      description: "安全远程访问员工设备，提供及时支持和指导",
      icon: <LockIcon className="h-10 w-10 text-destructive" />,
      href: "/remote-control",
      color: "from-destructive/20 to-destructive/5"
    },
    {
      title: "插件管理",
      description: "灵活扩展平台功能，满足企业特定需求",
      icon: <Puzzle className="h-10 w-10 text-purple" />,
      href: "/plugin-management",
      color: "from-purple/20 to-purple/5"
    }
  ];

  // 统计数据
  const stats = [
    { value: "30%", label: "效率提升", icon: <Zap className="h-5 w-5 text-primary" /> },
    { value: "25%", label: "时间节省", icon: <Clock className="h-5 w-5 text-primary" /> },
    { value: "500+", label: "企业客户", icon: <Users className="h-5 w-5 text-primary" /> },
    { value: "99.9%", label: "服务可靠性", icon: <Shield className="h-5 w-5 text-primary" /> }
  ];

  // 客户评价
  const testimonials = [
    {
      content: "Time Glass帮助我们团队提高了25%的工作效率，识别了多个时间浪费点，是我们管理团队的得力助手。",
      author: "张经理",
      role: "技术总监 · 科技公司"
    },
    {
      content: "通过使用Time Glass，我们优化了团队工作流程，减少了不必要的会议和干扰，员工满意度显著提升。",
      author: "李总监",
      role: "运营主管 · 电商平台"
    },
    {
      content: "作为一家快速成长的创业公司，Time Glass帮助我们建立了高效的工作文化，是我们不可或缺的工具。",
      author: "王总",
      role: "CEO · 创业公司"
    }
  ];

  return (
    <>
      {/* 英雄区域 - 更现代的设计 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20 border-b">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        {/* 装饰元素 */}
        <div className="absolute top-20 right-[10%] w-64 h-64 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute bottom-20 left-[5%] w-72 h-72 rounded-full bg-accent/5 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/3 blur-3xl opacity-30"></div>
        
        <PageContainer className="py-20 md:py-28">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col space-y-6"
            >
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary w-fit">
                全新升级 v2.0
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                员工生产力<br />智能分析平台
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                通过数据驱动洞察，全面监控、深入分析、优化员工工作效率，提升企业整体生产力
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                {isAuthenticated ? (
                  <Button size="lg" className="gap-2 rounded-full shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
                    <Link href="/productivity" className="flex items-center">
                      开始分析 <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button size="lg" className="gap-2 rounded-full shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
                      <Link href="/register" className="flex items-center">
                        免费注册 <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" className="gap-2 rounded-full border-primary/20 hover:bg-primary/5">
                      <Link href="/login">登录</Link>
                    </Button>
                  </>
                )}
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
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative w-full h-[300px] md:h-[400px] perspective-1000 hidden md:block"
            >
              {/* 3D效果的图表展示 */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shadow-2xl animate-slow-spin">
                <div className="w-[220px] h-[220px] rounded-full bg-gradient-to-tr from-primary/20 to-primary/10 flex items-center justify-center backdrop-blur-sm rotate-12 animate-reverse-slow-spin">
                  <div className="w-[160px] h-[160px] rounded-full bg-gradient-to-bl from-primary/30 to-primary/20 flex items-center justify-center backdrop-blur-md -rotate-6">
                    <BarChart2 className="w-20 h-20 text-primary drop-shadow-lg" />
                  </div>
                </div>
              </div>
              
              {/* 浮动的数据点 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute top-[20%] right-[15%] p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium">生产力提升 28%</span>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute bottom-[25%] left-[10%] p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium">团队协作优化</span>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute top-[60%] right-[5%] p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-medium">节省 20% 时间</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </PageContainer>
      </section>

      {/* 统计数字部分 */}
      <section className="bg-secondary/20 py-16">
        <PageContainer>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                variants={itemVariants}
                className="flex flex-col items-center text-center p-4 space-y-2"
              >
                <div className="p-3 rounded-full bg-primary/10 mb-2">
                  {stat.icon}
                </div>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </PageContainer>
      </section>

      {/* 功能区域 */}
      <PageContainer className="py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
        >
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
            核心功能
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">全方位员工生产力分析</h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            我们的平台提供多维度分析，帮助企业了解员工工作状态，优化资源配置
          </p>
        </motion.div>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <PageGrid columns={3}>
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Link href={feature.href} className="block h-full">
                  <Card className="h-full transition-all duration-300 hover:-translate-y-2 hover:shadow-lg overflow-hidden group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-50 group-hover:opacity-70 transition-opacity`}></div>
                    <CardHeader className="relative">
                      <div className="mb-2">{feature.icon}</div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="relative">
                      <Button variant="ghost" size="sm" className="group-hover:bg-background/50">
                        了解更多
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </PageGrid>
        </motion.div>
      </PageContainer>

      {/* 客户评价部分 */}
      <section className="bg-secondary/20 py-20">
        <PageContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
          >
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
              客户评价
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">客户如何评价我们</h2>
            <p className="max-w-[700px] text-muted-foreground md:text-lg">
              来自各行业客户的真实反馈
            </p>
          </motion.div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full bg-background border-0 shadow-md">
                  <CardContent className="pt-6">
                    <div className="mb-4 text-primary">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="inline-block mr-1">★</span>
                      ))}
                    </div>
                    <p className="text-muted-foreground italic mb-6">"{testimonial.content}"</p>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">{testimonial.author.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.author}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </PageContainer>
      </section>

      {/* 行动召唤区域 */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-rainbow">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <PageContainer className="py-20">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white"
            >
              准备好提升您的团队生产力了吗？
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-white/90 mb-8"
            >
              立即开始使用 Time Glass，发现您团队的真正潜力
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button size="lg" variant="secondary" className="rounded-full shadow-xl">
                <Link href={isAuthenticated ? "/productivity" : "/register"} className="flex items-center">
                  {isAuthenticated ? "进入控制台" : "免费注册"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10">
                <Link href="/about">预约演示</Link>
              </Button>
            </motion.div>
            
            {/* 信任徽章 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center gap-2 pt-8"
            >
              <CheckCircle className="h-5 w-5 text-white" />
              <span className="text-sm text-white/80">无需信用卡 · 14天免费试用 · 随时取消</span>
            </motion.div>
          </div>
        </PageContainer>
      </section>
    </>
  );
}

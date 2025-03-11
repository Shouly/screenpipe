"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader, PageSection, PageGrid } from "@/components/ui/page-container";
import { useAuth } from "@/lib/auth";
import { BarChart2, Monitor, EyeIcon, LockIcon, Puzzle, ArrowRight, ChevronRight } from "lucide-react";
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

  return (
    <>
      {/* 英雄区域 */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/50 border-b">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <PageContainer className="py-16 md:py-24">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                员工生产力分析平台
              </h1>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                全面监控、深入分析、优化员工工作效率，提升企业整体生产力
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {isAuthenticated ? (
                <Button size="lg" asChild>
                  <Link href="/productivity">
                    开始分析
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link href="/register">
                      免费注册
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/login">登录</Link>
                  </Button>
                </>
              )}
            </motion.div>
          </div>
        </PageContainer>
      </section>

      {/* 功能区域 */}
      <PageContainer>
        <PageHeader 
          title="全方位的生产力解决方案" 
          description="我们提供一套完整的工具，帮助您监控、分析和优化员工工作效率"
        />
        
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

      {/* 优势区域 */}
      <PageContainer className="bg-secondary/30">
        <PageHeader 
          title="为什么选择我们" 
          description="Time Glass 提供的独特优势"
        />
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>全面的数据分析</CardTitle>
              </CardHeader>
              <CardContent>
                <p>我们的平台收集并分析各种工作数据，提供全面的员工生产力洞察，帮助管理者做出明智决策。</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>易于使用的界面</CardTitle>
              </CardHeader>
              <CardContent>
                <p>直观的用户界面设计，让您无需专业技术背景即可轻松上手，快速获取所需信息。</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>安全可靠</CardTitle>
              </CardHeader>
              <CardContent>
                <p>采用先进的加密技术和严格的访问控制，确保您的数据安全，符合隐私法规要求。</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>可扩展性</CardTitle>
              </CardHeader>
              <CardContent>
                <p>灵活的插件系统允许您根据特定需求扩展平台功能，适应不同规模和类型的企业。</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </PageContainer>

      {/* 行动召唤区域 */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-rainbow">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <PageContainer className="py-16">
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
            >
              <Button size="lg" variant="secondary" asChild className="shadow-xl">
                <Link href={isAuthenticated ? "/productivity" : "/register"}>
                  {isAuthenticated ? "进入控制台" : "免费注册"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </PageContainer>
      </section>
    </>
  );
}

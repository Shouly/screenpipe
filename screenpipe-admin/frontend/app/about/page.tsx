import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, Target, Bell, Laptop, Mail, Heart, Shield, Users } from "lucide-react";

export default function About() {
  return (
    <div className="container py-10 max-w-5xl mx-auto">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">关于 Time Glass</h1>
          <p className="text-muted-foreground">
            了解我们的使命、价值观和团队
          </p>
        </div>
        
        <div className="grid gap-6">
          {/* 使命部分 */}
          <Card className="overflow-hidden">
            <div className="md:grid md:grid-cols-2">
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-12 w-12 text-primary" />
                </div>
              </div>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">我们的使命</h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Time Glass 致力于帮助人们更好地管理和利用他们的时间。在这个快节奏的世界中，时间是最宝贵的资源，
                    我们希望通过提供直观、易用的工具，帮助用户了解自己的时间去向，提高工作效率，实现更好的工作与生活平衡。
                  </p>
                  <p className="text-muted-foreground">
                    我们相信，通过可视化时间使用情况和提供有针对性的建议，每个人都可以更有意识地使用时间，
                    专注于真正重要的事情，减少时间浪费，提高生活质量。
                  </p>
                </div>
              </CardContent>
            </div>
          </Card>
          
          {/* 核心功能部分 */}
          <Card>
            <CardHeader>
              <CardTitle>核心功能</CardTitle>
              <CardDescription>
                Time Glass 提供的主要功能和服务
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                    <div className="p-2 w-fit rounded-full bg-primary/10 mb-3">
                      {feature.icon}
                    </div>
                    <h3 className="font-medium mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* 价值观部分 */}
          <Card>
            <CardHeader>
              <CardTitle>我们的价值观</CardTitle>
              <CardDescription>
                指导我们产品开发和服务的核心理念
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                {values.map((value, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-lg hover:bg-muted/50">
                    <div className="p-2 h-fit rounded-md bg-primary/10">
                      {value.icon}
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">{value.title}</h3>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* 联系我们部分 */}
          <Card className="overflow-hidden">
            <div className="md:grid md:grid-cols-2">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">联系我们</h2>
                <p className="text-muted-foreground mb-6">
                  如果您有任何问题、建议或反馈，请随时联系我们，我们将尽快回复您。
                </p>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <a href="mailto:contact@timeglass.app" className="text-primary hover:underline">
                    contact@timeglass.app
                  </a>
                </div>
              </CardContent>
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-12 w-12 text-primary" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: <Clock className="h-6 w-6 text-primary" />,
    title: "时间追踪",
    description: "记录您在不同活动上花费的时间，自动分类整理"
  },
  {
    icon: <Laptop className="h-6 w-6 text-primary" />,
    title: "多平台支持",
    description: "在任何设备上访问您的数据，随时随地管理时间"
  },
  {
    icon: <Target className="h-6 w-6 text-primary" />,
    title: "目标设定",
    description: "设定时间管理目标并追踪进度，保持动力"
  },
  {
    icon: <Bell className="h-6 w-6 text-primary" />,
    title: "提醒功能",
    description: "帮助您保持专注和按时完成任务，提高效率"
  }
];

const values = [
  {
    icon: <Users className="h-5 w-5 text-primary" />,
    title: "以用户为中心",
    description: "我们始终将用户需求放在首位，不断改进产品以提供最佳体验。"
  },
  {
    icon: <Shield className="h-5 w-5 text-primary" />,
    title: "隐私保护",
    description: "我们严格保护用户数据隐私，确保您的信息安全。"
  },
  {
    icon: <Target className="h-5 w-5 text-primary" />,
    title: "持续创新",
    description: "我们不断探索新技术和方法，为用户提供更智能的时间管理解决方案。"
  },
  {
    icon: <Heart className="h-5 w-5 text-primary" />,
    title: "工作与生活平衡",
    description: "我们相信高效工作的同时，也应该享受生活，保持身心健康。"
  }
]; 
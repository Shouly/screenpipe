"use client";

import Link from "next/link";
import { Clock, BarChart2, Brain, ArrowRight, FileCheck, Zap, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="flex flex-col items-center text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">screenpipe time glass</h1>
        <p className="text-lg text-gray-500 max-w-2xl">
          智能记录与分析你的数字活动，发现效率模式，优化工作体验
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Card className="border border-gray-200 dark:border-gray-800 hover:border-blue-500 hover:shadow-md transition-all">
          <CardHeader>
            <div className="w-14 h-14 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
              <Clock className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-xl">应用使用分析</CardTitle>
            <CardDescription>
              追踪并分析你的应用使用情况，发现效率模式
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              自动记录应用使用时间，分析工作习惯，帮助你了解时间去向，优化工作流程。通过直观的图表和数据，发现你的高效工作模式。
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/app-usage" className="w-full">
              <Button variant="outline" className="w-full group">
                <span>查看应用数据</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card className="border border-gray-200 dark:border-gray-800 hover:border-cyan-500 hover:shadow-md transition-all">
          <CardHeader>
            <div className="w-14 h-14 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center mb-4">
              <Brain className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
            </div>
            <CardTitle className="text-xl">智能工作日志</CardTitle>
            <CardDescription>
              自动生成详细的工作记录和见解
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              基于你的屏幕活动，自动生成工作日志，记录重要事项，提取关键见解，节省记录时间。让你专注于创造性工作，而不是记录工作内容。
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/log" className="w-full">
              <Button variant="outline" className="w-full group">
                <span>查看工作日志</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center mb-3">
              <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-lg">效率洞察</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              发现你的高效工作时段和习惯，优化日常工作流程，提升整体生产力。
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-3">
              <FileCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-lg">自动记录</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              无需手动记录，系统自动追踪你的数字活动，生成详细报告，让你专注于真正重要的事情。
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center mb-3">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-lg">智能建议</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              基于你的使用习惯，提供个性化建议，帮助你更有效地管理时间和注意力。
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-xl p-8 mb-12 border border-gray-200 dark:border-gray-800">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold mb-4">开始追踪你的数字生活</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">
            screenpipe time glass 自动记录你的应用使用情况，提供深入分析，帮助你更好地理解和优化你的数字习惯。
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/app-usage">
              <Button className="px-6">
                <Clock className="mr-2 h-4 w-4" />
                查看应用使用情况
              </Button>
            </Link>
            <Link href="/log">
              <Button variant="outline" className="px-6">
                <Brain className="mr-2 h-4 w-4" />
                浏览工作日志
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-500">
        <p>screenpipe time glass © {new Date().getFullYear()}</p>
        <p className="mt-1">智能记录与分析你的数字生活</p>
      </div>
    </div>
  );
}

"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import {
  BarChart,
  BarSeriesOption
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  GridComponentOption,
  TooltipComponentOption,
  LegendComponentOption
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { HourlyAppUsageSummary } from '@/lib/app-usage-api'

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

type EChartsOption = echarts.ComposeOption<
  BarSeriesOption | GridComponentOption | TooltipComponentOption | LegendComponentOption
>

interface HourlyAppUsageChartProps {
  data: HourlyAppUsageSummary[]
  height?: number
  maxApps?: number
}

export function HourlyAppUsageChart({ data, height = 300, maxApps = 5 }: HourlyAppUsageChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    // 初始化图表
    if (chartRef.current) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current)
      }

      // 处理数据
      const hours = Array.from(new Set(data.map(item => item.hour))).sort()
      
      // 按应用名称分组并计算总使用时间
      const appUsageMap = new Map<string, { total: number, type: string }>()
      data.forEach(item => {
        if (!appUsageMap.has(item.app_name)) {
          appUsageMap.set(item.app_name, { 
            total: Math.round(item.duration_minutes),
            type: item.productivity_type
          })
        } else {
          const current = appUsageMap.get(item.app_name)!
          appUsageMap.set(item.app_name, {
            total: current.total + Math.round(item.duration_minutes),
            type: current.type
          })
        }
      })
      
      // 按总使用时间排序并取前N个应用
      const topApps = Array.from(appUsageMap.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, maxApps)
        .map(([name, data]) => ({ 
          name, 
          total: data.total,
          type: data.type
        }))
      
      // 为每个应用创建系列数据
      const series = topApps.map((app, index) => {
        // 为每个小时创建数据点
        const hourData = hours.map(hour => {
          const hourItem = data.find(item => item.hour === hour && item.app_name === app.name)
          return hourItem ? Math.round(hourItem.duration_minutes) : 0
        })
        
        // 为每个应用分配不同的颜色
        const colors = [
          ['#10b981', '#059669'], // 绿色
          ['#3b82f6', '#2563eb'], // 蓝色
          ['#f97316', '#ea580c'], // 橙色
          ['#8b5cf6', '#7c3aed'], // 紫色
          ['#ec4899', '#db2777'], // 粉色
          ['#14b8a6', '#0d9488'], // 青色
          ['#f43f5e', '#e11d48'], // 红色
          ['#facc15', '#eab308'], // 黄色
          ['#6366f1', '#4f46e5'], // 靛蓝色
          ['#84cc16', '#65a30d']  // 酸橙色
        ]
        
        const colorIndex = index % colors.length
        const color = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: colors[colorIndex][0] },
          { offset: 1, color: colors[colorIndex][1] }
        ])
        
        return {
          name: app.name,
          type: 'bar' as const,
          stack: 'total',
          emphasis: {
            focus: 'series' as const
          },
          itemStyle: {
            color
          },
          data: hourData
        }
      })

      const option: EChartsOption = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params: any) => {
            let result = `<div style="padding: 8px;"><div style="font-weight: 500; margin-bottom: 4px;">${params[0].name}点</div>`
            
            // 按值从大到小排序
            const sortedParams = [...params].sort((a, b) => b.value - a.value)
            
            sortedParams.forEach((param: any) => {
              const color = param.color
              const name = param.seriesName
              const value = Math.round(param.value) // 将分钟数据取整
              
              if (value > 0) {
                result += `<div style="display: flex; align-items: center; margin-top: 3px;">
                  <span style="display: inline-block; width: 10px; height: 10px; background: ${color}; border-radius: 50%; margin-right: 5px;"></span>
                  <span style="font-size: 12px;">${name}: ${value} 分钟</span>
                </div>`
              }
            })
            
            result += '</div>'
            return result
          }
        },
        legend: {
          data: topApps.map(app => app.name),
          bottom: 0,
          type: 'scroll',
          itemWidth: 12,
          itemHeight: 12,
          textStyle: {
            fontSize: 12
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: hours,
          axisLine: {
            lineStyle: {
              color: '#ddd'
            }
          },
          axisTick: {
            alignWithLabel: true
          },
          axisLabel: {
            interval: 2,
            fontSize: 11
          }
        },
        yAxis: {
          type: 'value',
          name: '分钟',
          nameTextStyle: {
            padding: [0, 0, 0, 0]
          },
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            lineStyle: {
              type: 'dashed',
              color: '#eee'
            }
          },
          axisLabel: {
            formatter: (value: number) => Math.round(value).toString()
          }
        },
        series
      }

      chartInstance.current.setOption(option)
    }

    // 清理函数
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [data, maxApps])

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize()
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div 
      ref={chartRef} 
      style={{ 
        height: `${height}px`, 
        width: '100%' 
      }}
    />
  )
} 
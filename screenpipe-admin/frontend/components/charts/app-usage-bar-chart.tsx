"use client"

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface DailyUsageBarChartProps {
  data: Array<{
    day: string
    hours: number
  }>
  height?: number
}

export function DailyUsageBarChart({ data, height = 300 }: DailyUsageBarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    // 初始化图表
    if (chartRef.current) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current)
      }

      const option: any = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params: any) => {
            const { name, value } = params[0]
            return `
              <div style="padding: 8px;">
                <div style="font-weight: 500; margin-bottom: 4px;">${name}</div>
                <div style="font-size: 12px;">使用时间: ${value} 小时</div>
              </div>
            `
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '10%',
          top: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: data.map(item => item.day),
          axisLine: {
            lineStyle: {
              color: '#ddd'
            }
          },
          axisTick: {
            alignWithLabel: true
          }
        },
        yAxis: {
          type: 'value',
          name: '小时',
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
          }
        },
        series: [
          {
            name: '使用时间',
            type: 'bar',
            barWidth: '60%',
            data: data.map(item => ({
              value: item.hours,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#3b82f6' },
                  { offset: 1, color: '#60a5fa' }
                ])
              }
            })),
            showBackground: true,
            backgroundStyle: {
              color: 'rgba(180, 180, 180, 0.1)'
            },
            itemStyle: {
              borderRadius: [4, 4, 0, 0]
            }
          }
        ]
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
  }, [data])

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
"use client"

import { formatTimeSpent } from '@/lib/utils'
import * as echarts from 'echarts'
import { useEffect, useRef } from 'react'

interface AppUsagePieChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
  totalTime: number
  height?: number
}

export function AppUsagePieChart({ data, totalTime, height = 300 }: AppUsagePieChartProps) {
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
          trigger: 'item',
          formatter: (params: any) => {
            const { name, value, percent } = params
            return `
              <div style="padding: 8px;">
                <div style="font-weight: 500; margin-bottom: 4px;">${name}</div>
                <div style="font-size: 12px;">使用时间: ${formatTimeSpent(value)}</div>
                <div style="font-size: 12px;">占比: ${percent.toFixed(1)}%</div>
              </div>
            `
          }
        },
        legend: {
          orient: 'horizontal',
          bottom: 0,
          left: 'center',
          itemWidth: 12,
          itemHeight: 12,
          textStyle: {
            fontSize: 12
          }
        },
        series: [
          {
            name: '应用使用时间',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 4,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 14,
                fontWeight: 'bold',
                formatter: (params: any) => {
                  return `${params.name}\n${params.percent.toFixed(0)}%`
                }
              },
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.2)'
              }
            },
            labelLine: {
              show: false
            },
            data: data.map(item => ({
              ...item,
              itemStyle: {
                color: item.color
              }
            }))
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
  }, [data, totalTime])

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
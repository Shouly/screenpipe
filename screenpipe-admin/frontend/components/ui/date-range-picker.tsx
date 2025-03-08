"use client"

import * as React from "react"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { addDays, format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"

interface DateRangePickerProps {
  className?: string
  onChange: (range: DateRange | undefined) => void
  value: DateRange | undefined
  singleDay?: boolean
}

export function DateRangePicker({
  className,
  onChange,
  value,
  singleDay = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [date, setDate] = React.useState<DateRange | undefined>(value)

  React.useEffect(() => {
    setDate(value)
  }, [value])

  const handlePresetChange = (preset: string) => {
    const today = new Date()
    let from: Date
    let to: Date = today

    switch (preset) {
      case "today":
        from = today
        to = singleDay ? today : today
        break
      case "yesterday":
        from = addDays(today, -1)
        to = singleDay ? from : from
        break
      case "last7days":
        from = addDays(today, -6)
        to = singleDay ? from : today
        break
      case "last30days":
        from = addDays(today, -29)
        to = singleDay ? from : today
        break
      case "thisMonth":
        from = new Date(today.getFullYear(), today.getMonth(), 1)
        to = singleDay ? from : today
        break
      case "lastMonth":
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        to = singleDay ? from : new Date(today.getFullYear(), today.getMonth(), 0)
        break
      default:
        from = today
        to = singleDay ? from : today
    }

    onChange({ from, to })
    setIsOpen(false)
  }

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate)
    if (onChange) {
      onChange(newDate)
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-muted/50"
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="sr-only">选择日期</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex flex-col">
            <div className="flex items-center justify-between border-b p-3">
              <h3 className="text-sm font-medium">选择日期</h3>
              <Select
                onValueChange={handlePresetChange}
                defaultValue="today"
              >
                <SelectTrigger className="h-8 w-[120px]">
                  <SelectValue placeholder="选择日期" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">今天</SelectItem>
                  <SelectItem value="yesterday">昨天</SelectItem>
                  <SelectItem value="last7days">过去7天</SelectItem>
                  <SelectItem value="last30days">过去30天</SelectItem>
                  <SelectItem value="thisMonth">本月</SelectItem>
                  <SelectItem value="lastMonth">上月</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {singleDay ? (
              <div className="p-3">
                <DayPickerSingle 
                  selected={date?.from}
                  onSelect={(date) => {
                    if (date) {
                      onChange({ from: date, to: date });
                      setIsOpen(false);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="p-3">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={handleDateChange}
                  numberOfMonths={2}
                />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// 单日选择器组件
function DayPickerSingle({ selected, onSelect }: { 
  selected?: Date, 
  onSelect: (date?: Date) => void 
}) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  
  // 生成月份标题
  const monthTitle = format(currentMonth, "M月 yyyy", { locale: zhCN });
  
  // 生成星期标题
  const weekdays = ["一", "二", "三", "四", "五", "六", "日"];
  
  // 获取当月的天数
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  
  // 获取当月第一天是星期几 (0-6, 0是星期日)
  let firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();
  // 调整为星期一为一周的第一天
  firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  
  // 生成日期网格
  const days = [];
  // 添加上个月的占位日期
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // 添加当月的日期
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }
  
  // 处理月份导航
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // 检查日期是否是今天
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  // 检查日期是否被选中
  const isSelected = (date: Date) => {
    if (!selected) return false;
    return date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear();
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handlePrevMonth}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">{monthTitle}</div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleNextMonth}
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((day, i) => (
          <div key={i} className="text-xs text-muted-foreground font-medium py-1">
            {day}
          </div>
        ))}
        
        {days.map((day, i) => (
          <div key={i} className="p-0">
            {day ? (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 font-normal rounded-full",
                  isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  isToday(day) && !isSelected(day) && "bg-accent text-accent-foreground"
                )}
                onClick={() => onSelect(day)}
              >
                {day.getDate()}
              </Button>
            ) : (
              <div className="h-8 w-8"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 日期范围选择器组件
function DayPickerRange({ selected, onSelect }: { 
  selected?: DateRange, 
  onSelect: (range?: DateRange) => void 
}) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  // const [hoverDate, setHoverDate] = React.useState<Date | null>(null);
  
  // 生成月份标题
  const monthTitle = format(currentMonth, "M月 yyyy", { locale: zhCN });
  
  // 生成星期标题
  const weekdays = ["一", "二", "三", "四", "五", "六", "日"];
  
  // 获取当月的天数
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  
  // 获取当月第一天是星期几 (0-6, 0是星期日)
  let firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();
  // 调整为星期一为一周的第一天
  firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  
  // 生成日期网格
  const days = [];
  // 添加上个月的占位日期
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // 添加当月的日期
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }
  
  // 处理月份导航
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // 检查日期是否是今天
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  // 检查日期是否在选中范围内
  const isInRange = (date: Date) => {
    if (!selected?.from || !selected?.to) return false;
    return date >= selected.from && date <= selected.to;
  };
  
  // 检查日期是否是范围的开始或结束
  const isRangeStart = (date: Date) => {
    if (!selected?.from) return false;
    return date.getDate() === selected.from.getDate() &&
      date.getMonth() === selected.from.getMonth() &&
      date.getFullYear() === selected.from.getFullYear();
  };
  
  const isRangeEnd = (date: Date) => {
    if (!selected?.to) return false;
    return date.getDate() === selected.to.getDate() &&
      date.getMonth() === selected.to.getMonth() &&
      date.getFullYear() === selected.to.getFullYear();
  };
  
  // 处理日期选择
  const handleDateClick = (date: Date) => {
    if (!selected?.from || (selected.from && selected.to)) {
      // 开始新的选择
      onSelect({ from: date, to: undefined });
    } else {
      // 完成选择范围
      if (date < selected.from) {
        onSelect({ from: date, to: selected.from });
      } else {
        onSelect({ from: selected.from, to: date });
      }
    }
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handlePrevMonth}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">{monthTitle}</div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleNextMonth}
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((day, i) => (
          <div key={i} className="text-xs text-muted-foreground font-medium py-1">
            {day}
          </div>
        ))}
        
        {days.map((day, i) => (
          <div key={i} className="p-0">
            {day ? (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 font-normal",
                  isRangeStart(day) && "bg-primary text-primary-foreground rounded-l-full",
                  isRangeEnd(day) && "bg-primary text-primary-foreground rounded-r-full",
                  isInRange(day) && !isRangeStart(day) && !isRangeEnd(day) && "bg-primary/20",
                  isToday(day) && !isInRange(day) && "bg-accent text-accent-foreground"
                )}
                onClick={() => handleDateClick(day)}
                // onMouseEnter={() => setHoverDate(day)}
                // onMouseLeave={() => setHoverDate(null)}
              >
                {day.getDate()}
              </Button>
            ) : (
              <div className="h-8 w-8"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
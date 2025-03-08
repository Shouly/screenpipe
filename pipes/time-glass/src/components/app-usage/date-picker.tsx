"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface DatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function DatePicker({ date, onDateChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  
  // 确保日期对象是当地时间的午夜时刻
  const ensureLocalDate = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };
  
  // 使用当地时间的今天日期
  const today = ensureLocalDate(new Date());
  
  // 确保传入的日期也是当地时间的午夜时刻
  const localDate = ensureLocalDate(date);

  const isToday = localDate.getTime() === today.getTime();

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    return date.toLocaleDateString('zh-CN', options);
  };

  const handlePrevDay = () => {
    const newDate = new Date(localDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(localDate);
    newDate.setDate(newDate.getDate() + 1);
    
    // 不允许选择未来的日期
    if (newDate.getTime() <= today.getTime()) {
      onDateChange(newDate);
    }
  };

  const handleToday = () => {
    onDateChange(today);
  };

  return (
    <div className="flex flex-col items-end">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 h-10 px-4 rounded-full border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{formatDate(localDate)}</span>
            {isToday && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                今天
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <CalendarComponent
            mode="single"
            selected={localDate}
            onSelect={(date) => {
              if (date) {
                // 确保选择的日期也是本地时间的午夜时刻
                onDateChange(ensureLocalDate(date));
                setOpen(false);
              }
            }}
            disabled={(date) => ensureLocalDate(date).getTime() > today.getTime()}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      
      <div className="flex items-center space-x-2 mt-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          onClick={handlePrevDay}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          前一天
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
            isToday && "text-blue-500 dark:text-blue-400 font-medium"
          )}
          onClick={handleToday}
        >
          今天
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          onClick={handleNextDay}
          disabled={isToday}
        >
          后一天
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
} 
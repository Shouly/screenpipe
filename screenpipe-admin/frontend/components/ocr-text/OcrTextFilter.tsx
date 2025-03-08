"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { getOcrTextApps, getOcrTextWindows, OcrTextQueryParams } from '@/lib/api';
import { CalendarIcon, SearchIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { format, subDays } from 'date-fns';

interface OcrTextFilterProps {
  clientId?: string;
  onClientIdChange?: (clientId: string) => void;
  onFilterChange: (filters: OcrTextQueryParams) => void;
}

export const OcrTextFilter: React.FC<OcrTextFilterProps> = ({
  clientId,
  onClientIdChange,
  onFilterChange
}) => {
  const [localClientId, setLocalClientId] = useState<string>(clientId || '');
  const [apps, setApps] = useState<string[]>([]);
  const [windows, setWindows] = useState<string[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [selectedWindow, setSelectedWindow] = useState<string>('all');
  const [focused, setFocused] = useState<boolean | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (clientId !== localClientId) {
      setLocalClientId(clientId || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    loadApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localClientId]);

  useEffect(() => {
    loadWindows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localClientId, selectedApp]);

  // 应用初始过滤器
  useEffect(() => {
    handleApplyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadApps = async () => {
    try {
      setLoading(true);
      const appList = await getOcrTextApps(localClientId || undefined);
      setApps(appList.filter(app => app !== ''));
    } catch (error) {
      console.error('Error loading apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWindows = async () => {
    try {
      setLoading(true);
      const windowList = await getOcrTextWindows(
        localClientId || undefined,
        selectedApp === 'all' ? undefined : selectedApp
      );
      setWindows(windowList.filter(window => window !== ''));
    } catch (error) {
      console.error('Error loading windows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newClientId = e.target.value;
    setLocalClientId(newClientId);
    if (onClientIdChange) {
      onClientIdChange(newClientId);
    }
  };

  const handleAppChange = (value: string) => {
    setSelectedApp(value);
    setSelectedWindow('all'); // Reset window selection when app changes
  };

  const handleWindowChange = (value: string) => {
    setSelectedWindow(value);
  };

  const handleFocusedChange = (checked: boolean) => {
    setFocused(checked ? true : undefined);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const handleApplyFilters = () => {
    const filters: OcrTextQueryParams = {
      client_id: localClientId || undefined,
      app_name: selectedApp !== "all" ? selectedApp : undefined,
      window_name: selectedWindow !== "all" ? selectedWindow : undefined,
      focused: focused,
      startTime: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd\'T\'HH:mm:ss') : undefined,
      endTime: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd\'T\'HH:mm:ss') : undefined,
      page: 1
    };
    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    setSelectedApp('all');
    setSelectedWindow('all');
    setFocused(undefined);
    setDateRange({
      from: subDays(new Date(), 7),
      to: new Date()
    });
    
    const filters: OcrTextQueryParams = {
      client_id: localClientId || undefined,
      page: 1
    };
    onFilterChange(filters);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client-id">客户端 ID</Label>
            <Input
              id="client-id"
              placeholder="输入客户端ID"
              value={localClientId}
              onChange={handleClientIdChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="app-name">应用程序</Label>
            <Select value={selectedApp} onValueChange={handleAppChange}>
              <SelectTrigger id="app-name">
                <SelectValue placeholder="选择应用程序" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部应用</SelectItem>
                {apps.filter(app => app && app.trim() !== '').map((app) => (
                  <SelectItem key={app} value={app}>
                    {app}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="window-name">窗口</Label>
            <Select value={selectedWindow} onValueChange={handleWindowChange}>
              <SelectTrigger id="window-name">
                <SelectValue placeholder="选择窗口" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部窗口</SelectItem>
                {windows.filter(window => window && window.trim() !== '').map((window) => (
                  <SelectItem key={window} value={window}>
                    {window}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>时间范围</Label>
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="focused" className="flex items-center justify-between">
              <span>仅显示聚焦窗口</span>
              <Switch
                id="focused"
                checked={focused === true}
                onCheckedChange={handleFocusedChange}
              />
            </Label>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleResetFilters}>
            重置
          </Button>
          <Button onClick={handleApplyFilters}>
            <SearchIcon className="h-4 w-4 mr-2" />
            应用过滤器
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OcrTextFilter; 
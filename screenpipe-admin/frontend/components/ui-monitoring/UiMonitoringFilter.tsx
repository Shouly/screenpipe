"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getUiMonitoringApps, getUiMonitoringWindows, UiMonitoringQueryParams } from '@/lib/api';
import { FilterIcon, RotateCcwIcon, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface UiMonitoringFilterProps {
  clientId?: string;
  onClientIdChange?: (clientId: string) => void;
  onFilterChange: (filters: UiMonitoringQueryParams) => void;
}

export const UiMonitoringFilter: React.FC<UiMonitoringFilterProps> = ({
  clientId,
  onClientIdChange,
  onFilterChange
}) => {
  const [localClientId, setLocalClientId] = useState<string>(clientId || '');
  const [apps, setApps] = useState<string[]>([]);
  const [windows, setWindows] = useState<string[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [selectedWindow, setSelectedWindow] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAdvancedFiltersVisible, setIsAdvancedFiltersVisible] = useState<boolean>(false);

  useEffect(() => {
    if (clientId !== undefined) {
      setLocalClientId(clientId);
    }
  }, [clientId]);

  useEffect(() => {
    loadApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    if (selectedApp && selectedApp !== 'all') {
      loadWindows();
    } else {
      setWindows([]);
      setSelectedWindow('all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApp, clientId]);

  const loadApps = async () => {
    try {
      setLoading(true);
      const appsList = await getUiMonitoringApps(clientId);
      setApps(appsList);
    } catch (error) {
      console.error('Error loading apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWindows = async () => {
    try {
      setLoading(true);
      const windowsList = await getUiMonitoringWindows(clientId, selectedApp !== 'all' ? selectedApp : undefined);
      setWindows(windowsList);
    } catch (error) {
      console.error('Error loading windows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppChange = (value: string) => {
    setSelectedApp(value);
  };

  const handleWindowChange = (value: string) => {
    setSelectedWindow(value);
  };

  const handleClientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalClientId(e.target.value);
  };

  const handleClientIdSubmit = () => {
    if (onClientIdChange) {
      onClientIdChange(localClientId);
    }
  };

  const applyFilters = () => {
    const filters: UiMonitoringQueryParams = {
      client_id: clientId,
      app: selectedApp !== 'all' ? selectedApp : undefined,
      window: selectedWindow !== 'all' ? selectedWindow : undefined,
      startTime: startDate ? startDate.toISOString() : undefined,
      endTime: endDate ? endDate.toISOString() : undefined
    };
    onFilterChange(filters);
  };

  const resetFilters = () => {
    setSelectedApp('all');
    setSelectedWindow('all');
    setStartDate(undefined);
    setEndDate(undefined);
    onFilterChange({ client_id: clientId });
  };

  const toggleAdvancedFilters = () => {
    setIsAdvancedFiltersVisible(!isAdvancedFiltersVisible);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>筛选数据</CardTitle>
            <CardDescription>查找和筛选 UI 监控数据</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAdvancedFilters}
            className="h-8 gap-1"
          >
            <FilterIcon className="h-4 w-4" />
            {isAdvancedFiltersVisible ? '收起高级筛选' : '高级筛选'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 客户端 ID 筛选 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="client-id">客户端 ID</Label>
            <div className="flex gap-2">
              <Input
                id="client-id"
                placeholder="输入客户端 ID 筛选数据"
                value={localClientId}
                onChange={handleClientIdChange}
                className="flex-1"
              />
              <Button
                onClick={handleClientIdSubmit}
                disabled={!localClientId.trim() || localClientId === clientId}
                className="gap-1"
              >
                <Search className="h-4 w-4" />
                应用
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setLocalClientId('');
                  if (onClientIdChange) onClientIdChange('');
                }}
                disabled={!localClientId && !clientId}
                className="gap-1"
              >
                <RotateCcwIcon className="h-4 w-4" />
                清除
              </Button>
            </div>
          </div>
        </div>

        {/* 高级筛选选项 */}
        {isAdvancedFiltersVisible && (
          <div className="pt-4 border-t space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="app-select">应用程序</Label>
                <Select
                  value={selectedApp}
                  onValueChange={handleAppChange}
                  disabled={loading}
                >
                  <SelectTrigger id="app-select" className="w-full">
                    <SelectValue placeholder="所有应用程序" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有应用程序</SelectItem>
                    {apps.map((app) => (
                      <SelectItem key={app} value={app}>
                        {app}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="window-select">窗口</Label>
                <Select
                  value={selectedWindow}
                  onValueChange={handleWindowChange}
                  disabled={loading || selectedApp === 'all'}
                >
                  <SelectTrigger id="window-select" className="w-full">
                    <SelectValue placeholder="所有窗口" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有窗口</SelectItem>
                    {windows.map((window) => (
                      <SelectItem key={window} value={window}>
                        {window}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始日期</Label>
                <DatePicker
                  date={startDate}
                  setDate={setStartDate}
                  label="选择开始日期"
                />
              </div>

              <div className="space-y-2">
                <Label>结束日期</Label>
                <DatePicker
                  date={endDate}
                  setDate={setEndDate}
                  label="选择结束日期"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={resetFilters}
                disabled={loading}
                className="gap-1"
              >
                <RotateCcwIcon className="h-4 w-4" />
                重置筛选
              </Button>
              <Button
                variant="default"
                onClick={applyFilters}
                disabled={loading}
                className="gap-1"
              >
                <FilterIcon className="h-4 w-4" />
                应用筛选
              </Button>
            </div>
          </div>
        )}

        {/* 当前筛选条件显示 */}
        {clientId && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span>当前筛选客户端:</span>
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                {clientId}
              </code>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 
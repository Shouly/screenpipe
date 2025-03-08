"use client";

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getUiMonitoring, UiMonitoringItem, UiMonitoringQueryParams } from '@/lib/api';
import { AlertCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { UiMonitoringFilter } from './UiMonitoringFilter';
import { UiMonitoringList } from './UiMonitoringList';

interface UiMonitoringPageProps {
  clientId?: string;
  onClientIdChange?: (clientId: string) => void;
}

export const UiMonitoringPage: React.FC<UiMonitoringPageProps> = ({
  clientId,
  onClientIdChange
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<UiMonitoringItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UiMonitoringQueryParams>({
    client_id: clientId,
    page: 1,
    pageSize: 10
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (clientId !== filters.client_id) {
      setFilters(prev => ({ ...prev, client_id: clientId, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUiMonitoring({
        ...filters,
        page: currentPage,
        pageSize
      });
      setItems(response.items);
      setTotalItems(response.total);
    } catch (error) {
      console.error('Error loading UI monitoring data:', error);
      setError('加载数据时出错，请稍后重试');
      setItems([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: UiMonitoringQueryParams) => {
    setCurrentPage(1); // Reset to first page when filters change
    setFilters({ ...newFilters, page: 1, pageSize });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters({ ...filters, page, pageSize });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
    setFilters({ ...filters, page: 1, pageSize: size });
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <UiMonitoringFilter
        clientId={clientId}
        onClientIdChange={onClientIdChange}
        onFilterChange={handleFilterChange}
      />

      <UiMonitoringList
        items={items}
        total={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        loading={loading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

export default UiMonitoringPage; 
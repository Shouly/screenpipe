import axios from 'axios';

// Base API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// UI Monitoring interfaces
export interface UiMonitoringItem {
  client_id: string;
  report_id: string;
  monitoring_id: number | string;
  timestamp: string;
  app: string;
  window: string;
  text?: string;
  text_output?: string;
  text_length: number;
  metadata?: Record<string, unknown>;
  platform?: string;
  os?: string;
  os_version?: string;
  hostname?: string;
  initial_traversal_at?: string;
  extracted_at?: string;
  app_version?: string;
  reporting_period_start?: string;
  reporting_period_end?: string;
}

export interface UiMonitoringResponse {
  items: UiMonitoringItem[];
  total: number;
}

export interface UiMonitoringQueryParams {
  client_id?: string;
  app?: string;
  window?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}

// UI Monitoring API functions
export async function getUiMonitoring(params: UiMonitoringQueryParams): Promise<UiMonitoringResponse> {
  const response = await api.get('/query/ui-monitoring', { params });
  return response.data;
}

export async function getUiMonitoringApps(clientId?: string): Promise<string[]> {
  const params = clientId ? { client_id: clientId } : {};
  const response = await api.get('/query/ui-monitoring/apps', { params });
  return response.data;
}

export async function getUiMonitoringWindows(clientId?: string, app?: string): Promise<string[]> {
  const params: Record<string, string> = {};
  if (clientId) params.client_id = clientId;
  if (app) params.app = app;

  const response = await api.get('/query/ui-monitoring/windows', { params });
  return response.data;
}

// OCR文本接口
export interface OcrTextItem {
  client_id: string;
  report_id: string;
  frame_id: number | string;
  timestamp: string;
  app_name: string;
  window_name: string;
  text: string;
  focused: boolean;
  text_length: number;
  platform?: string;
  os?: string;
  os_version?: string;
  hostname?: string;
  extracted_at?: string;
  app_version?: string;
  reporting_period_start?: string;
  reporting_period_end?: string;
}

export interface OcrTextResponse {
  items: OcrTextItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface OcrTextQueryParams {
  client_id?: string;
  app_name?: string;
  window_name?: string;
  focused?: boolean;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
  sort_order?: 'asc' | 'desc';
}

// OCR文本API函数
export async function getOcrText(params: OcrTextQueryParams): Promise<OcrTextResponse> {
  const queryParams: Record<string, any> = {
    ...params,
    limit: params.pageSize,
    offset: params.pageSize ? (params.page ? (params.page - 1) * params.pageSize : 0) : 0
  };
  
  // 删除前端特定的参数
  delete queryParams.page;
  delete queryParams.pageSize;
  
  const response = await api.get('/query/ocr-text', { params: queryParams });
  return response.data;
}

export async function getOcrTextApps(clientId?: string): Promise<string[]> {
  const params = clientId ? { client_id: clientId } : {};
  const response = await api.get('/query/ocr-text/apps', { params });
  return response.data;
}

export async function getOcrTextWindows(clientId?: string, appName?: string): Promise<string[]> {
  const params: Record<string, string> = {};
  if (clientId) params.client_id = clientId;
  if (appName) params.app_name = appName;

  const response = await api.get('/query/ocr-text/windows', { params });
  return response.data;
} 
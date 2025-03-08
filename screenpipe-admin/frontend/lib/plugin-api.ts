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

// 插件状态类型
export type PluginStatus = "active" | "inactive" | "deprecated";

// 插件可见性类型
export type PluginVisibility = "public" | "private" | "organization";

// 插件版本接口
export interface PluginVersion {
  id: number;
  plugin_id: number;
  version: string;
  zip_url: string;
  zip_hash: string;
  zip_size: number;
  changelog?: string;
  min_app_version?: string;
  dependencies?: Record<string, string>;
  created_at: string;
  is_latest: boolean;
  download_count: number;
}

// 插件接口
export interface Plugin {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  tags?: string[];
  status: PluginStatus;
  visibility: PluginVisibility;
  created_at: string;
  updated_at: string;
  downloads_count: number;
  versions: PluginVersion[];
}

// 创建插件请求接口
export interface CreatePluginRequest {
  name: string;
  description?: string;
  tags?: string[];
  status?: PluginStatus;
  visibility?: PluginVisibility;
}

// 更新插件请求接口
export interface UpdatePluginRequest {
  name?: string;
  description?: string;
  tags?: string[];
  status?: PluginStatus;
  visibility?: PluginVisibility;
}

// 创建插件版本请求接口
export interface CreateVersionRequest {
  version: string;
  changelog?: string;
  min_app_version?: string;
  dependencies?: Record<string, string>;
  zip_file: File;
}

/**
 * 获取所有插件
 * @returns 插件列表
 */
export async function getPlugins(): Promise<Plugin[]> {
  const response = await api.get('/plugin/admin/plugins');
  return response.data;
}

/**
 * 获取插件详情
 * @param pluginId 插件ID
 * @returns 插件详情
 */
export async function getPlugin(pluginId: number): Promise<Plugin> {
  const response = await api.get(`/plugin/admin/plugins/${pluginId}`);
  return response.data;
}

/**
 * 创建插件
 * @param data 插件数据
 * @returns 创建的插件
 */
export async function createPlugin(data: CreatePluginRequest): Promise<Plugin> {
  const response = await api.post('/plugin/admin/plugins', data);
  return response.data;
}

/**
 * 更新插件
 * @param pluginId 插件ID
 * @param data 更新数据
 * @returns 更新后的插件
 */
export async function updatePlugin(pluginId: number, data: UpdatePluginRequest): Promise<Plugin> {
  const response = await api.put(`/plugin/admin/plugins/${pluginId}`, data);
  return response.data;
}

/**
 * 删除插件
 * @param pluginId 插件ID
 */
export async function deletePlugin(pluginId: number): Promise<void> {
  await api.delete(`/plugin/admin/plugins/${pluginId}`);
}

/**
 * 获取插件版本列表
 * @param pluginId 插件ID
 * @returns 版本列表
 */
export async function getPluginVersions(pluginId: number): Promise<PluginVersion[]> {
  const response = await api.get(`/plugin/admin/plugins/${pluginId}/versions`);
  return response.data;
}

/**
 * 创建插件版本
 * @param pluginId 插件ID
 * @param data 版本数据
 * @returns 创建的版本
 */
export async function createPluginVersion(pluginId: number, data: CreateVersionRequest): Promise<PluginVersion> {
  const formData = new FormData();
  formData.append('version', data.version);
  
  if (data.changelog) {
    formData.append('changelog', data.changelog);
  }
  
  if (data.min_app_version) {
    formData.append('min_app_version', data.min_app_version);
  }
  
  if (data.dependencies) {
    formData.append('dependencies', JSON.stringify(data.dependencies));
  }
  
  formData.append('zip_file', data.zip_file);
  
  const response = await api.post(`/plugin/admin/plugins/${pluginId}/versions`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
}

/**
 * 删除插件版本
 * @param pluginId 插件ID
 * @param versionId 版本ID
 */
export async function deletePluginVersion(pluginId: number, versionId: number): Promise<void> {
  await api.delete(`/plugin/admin/plugins/${pluginId}/versions/${versionId}`);
}

/**
 * 下载插件版本
 * @param pluginId 插件ID
 * @param version 版本号
 * @returns 下载URL
 */
export function getPluginDownloadUrl(pluginId: number, version: string): string {
  return `${API_BASE_URL}/plugin/plugins/${pluginId}/versions/${version}/download`;
} 
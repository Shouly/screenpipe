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

// 客户端连接接口
export interface ClientConnection {
  client_id: string;
  connected_at: string;
  last_heartbeat: string;
  is_active: boolean;
  metadata?: Record<string, any>;
}

// 客户端列表响应接口
export interface ClientListResponse {
  clients: ClientConnection[];
  total: number;
}

// 命令结果接口
export interface CommandResult {
  command_id: string;
  success: boolean;
  message: string;
  timestamp: string;
  client_id: string;
}

// 命令结果列表响应接口
export interface CommandResultsResponse {
  results: CommandResult[];
  total: number;
}

/**
 * 获取所有客户端列表
 * @returns 客户端列表响应
 */
export async function getClients(): Promise<ClientListResponse> {
  const response = await api.get('/remote-control/clients');
  return response.data;
}

/**
 * 获取指定客户端详情
 * @param clientId 客户端ID
 * @returns 客户端连接信息
 */
export async function getClient(clientId: string): Promise<ClientConnection> {
  const response = await api.get(`/remote-control/clients/${clientId}`);
  return response.data;
}

/**
 * 发送锁屏命令到指定客户端
 * @param clientId 客户端ID
 * @returns 命令ID
 */
export async function sendLockScreenCommand(clientId: string): Promise<{ command_id: string }> {
  const response = await api.post(`/remote-control/clients/${clientId}/lock-screen`);
  return response.data;
}

/**
 * 发送关机命令到指定客户端
 * @param clientId 客户端ID
 * @param delaySeconds 延迟时间（秒）
 * @returns 命令ID
 */
export async function sendShutdownCommand(clientId: string, delaySeconds: number = 0): Promise<{ command_id: string }> {
  const response = await api.post(`/remote-control/clients/${clientId}/shutdown?delay_seconds=${delaySeconds}`);
  return response.data;
}

/**
 * 获取所有命令执行结果
 * @returns 命令结果列表响应
 */
export async function getCommandResults(): Promise<CommandResultsResponse> {
  const response = await api.get('/remote-control/commands');
  return response.data;
}

/**
 * 获取指定命令的执行结果
 * @param commandId 命令ID
 * @returns 命令结果
 */
export async function getCommandResult(commandId: string): Promise<CommandResult> {
  const response = await api.get(`/remote-control/commands/${commandId}`);
  return response.data;
} 
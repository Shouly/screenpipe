import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { debounce } from "lodash";

interface HealthCheckResponse {
  status: string;
  status_code: number;
  last_frame_timestamp: string | null;
  last_audio_timestamp: string | null;
  last_ui_timestamp: string | null;
  frame_status: string;
  audio_status: string;
  ui_status: string;
  message: string;
}

function isHealthChanged(
  oldHealth: HealthCheckResponse | null,
  newHealth: HealthCheckResponse
): boolean {
  if (!oldHealth) return true;
  return (
    oldHealth.status !== newHealth.status ||
    oldHealth.status_code !== newHealth.status_code ||
    oldHealth.last_frame_timestamp !== newHealth.last_frame_timestamp ||
    oldHealth.last_audio_timestamp !== newHealth.last_audio_timestamp ||
    oldHealth.last_ui_timestamp !== newHealth.last_ui_timestamp ||
    oldHealth.frame_status !== newHealth.frame_status ||
    oldHealth.audio_status !== newHealth.audio_status ||
    oldHealth.ui_status !== newHealth.ui_status ||
    oldHealth.message !== newHealth.message
  );
}

interface HealthCheckHook {
  health: HealthCheckResponse | null;
  isServerDown: boolean;
  isLoading: boolean;
  fetchHealth: () => Promise<void>;
  debouncedFetchHealth: () => Promise<void>;
}

// 创建一个全局的WebSocket实例和状态
let globalWs: WebSocket | null = null;
let globalRetryInterval: NodeJS.Timeout | null = null;
let globalHealth: HealthCheckResponse | null = null;
let globalIsServerDown = false;
let globalIsLoading = true;
let listeners: Set<(health: HealthCheckResponse | null) => void> = new Set();

// 初始化WebSocket连接
function initWebSocket() {
  if (globalWs && (globalWs.readyState === WebSocket.CONNECTING || globalWs.readyState === WebSocket.OPEN)) {
    return; // 已经有活跃的连接
  }

  if (globalRetryInterval) {
    clearInterval(globalRetryInterval);
    globalRetryInterval = null;
  }

  globalWs = new WebSocket("ws://127.0.0.1:3030/ws/health");
  
  globalWs.onopen = () => {
    globalIsLoading = false;
    globalIsServerDown = false;
    notifyListeners();
  };

  globalWs.onmessage = (event) => {
    const data: HealthCheckResponse = JSON.parse(event.data);
    if (!globalHealth || isHealthChanged(globalHealth, data)) {
      globalHealth = data;
      notifyListeners();
    }
  };

  globalWs.onerror = (event) => {
    const error = event as ErrorEvent;
    const errorHealth: HealthCheckResponse = {
      status: "error",
      status_code: 500,
      last_frame_timestamp: null,
      last_audio_timestamp: null,
      last_ui_timestamp: null,
      frame_status: "error",
      audio_status: "error",
      ui_status: "error",
      message: error.message,
    };
    globalHealth = errorHealth;
    globalIsServerDown = true;
    globalIsLoading = false;
    notifyListeners();
    
    if (!globalRetryInterval) {
      globalRetryInterval = setInterval(initWebSocket, 2000);
    }
  };

  globalWs.onclose = () => {
    const errorHealth: HealthCheckResponse = {
      status: "error",
      status_code: 500,
      last_frame_timestamp: null,
      last_audio_timestamp: null,
      last_ui_timestamp: null,
      frame_status: "error",
      audio_status: "error",
      ui_status: "error",
      message: "WebSocket connection closed",
    };
    globalHealth = errorHealth;
    globalIsServerDown = true;
    notifyListeners();
    
    if (!globalRetryInterval) {
      globalRetryInterval = setInterval(initWebSocket, 2000);
    }
  };
}

// 通知所有监听器
function notifyListeners() {
  listeners.forEach(listener => listener(globalHealth));
}

// 初始化全局WebSocket
if (typeof window !== 'undefined') {
  initWebSocket();
}

export function useHealthCheck() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(globalHealth);
  const [isServerDown, setIsServerDown] = useState(globalIsServerDown);
  const [isLoading, setIsLoading] = useState(globalIsLoading);

  const fetchHealth = useCallback(async () => {
    // 重新初始化WebSocket连接
    initWebSocket();
    return Promise.resolve();
  }, []);

  const debouncedFetchHealth = useCallback(() => {
    return new Promise<void>((resolve) => {
      debounce(() => {
        if (globalWs && globalWs.readyState === WebSocket.OPEN) {
          fetchHealth().then(resolve);
        } else {
          resolve();
        }
      }, 1000)();
    });
  }, [fetchHealth]);

  useEffect(() => {
    // 添加监听器
    const listener = (newHealth: HealthCheckResponse | null) => {
      setHealth(newHealth);
      setIsServerDown(globalIsServerDown);
      setIsLoading(globalIsLoading);
    };
    
    listeners.add(listener);
    
    // 立即同步状态
    listener(globalHealth);
    
    return () => {
      // 移除监听器
      listeners.delete(listener);
    };
  }, []);

  return {
    health,
    isServerDown,
    isLoading,
    fetchHealth,
    debouncedFetchHealth,
  } as HealthCheckHook;
}

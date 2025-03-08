use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use tauri::AppHandle;
use tokio::net::TcpStream;
use tokio::sync::Mutex;
use tokio::time;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message, MaybeTlsStream, WebSocketStream};
use tracing::{debug, error, info};
use futures::{SinkExt, StreamExt};
use std::process::Command;
use serde_json::json;
use crate::permissions::{check_system_control_permission, OSPermissionStatus};

// 远程控制配置
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RemoteControlConfig {
    pub enabled: bool,                // 是否启用远程控制
    pub server_url: String,           // WebSocket服务器URL
    pub auth_token: String,           // 认证令牌
    pub client_id: String,            // 客户端ID
    pub reconnect_interval_secs: u64, // 重连间隔（秒）
    pub heartbeat_interval_secs: u64, // 心跳间隔（秒）
    pub commands: RemoteCommandsConfig, // 命令配置
}

// 远程命令配置
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RemoteCommandsConfig {
    pub lock_screen_enabled: bool,    // 是否启用锁屏命令
    pub shutdown_enabled: bool,       // 是否启用关机命令
}

impl Default for RemoteControlConfig {
    fn default() -> Self {
        Self {
            enabled: true,  // 默认启用
            server_url: "ws://localhost:8000/api/v1/remote-control/ws".to_string(),  // 本地WebSocket服务器
            auth_token: "default-auth-token".to_string(),
            client_id: "".to_string(),
            reconnect_interval_secs: 30,
            heartbeat_interval_secs: 30,
            commands: RemoteCommandsConfig {
                lock_screen_enabled: true,
                shutdown_enabled: true,
            },
        }
    }
}

// 获取远程控制配置（使用硬编码的默认配置）
pub fn get_remote_control_config(_app_handle: &AppHandle) -> Result<RemoteControlConfig> {
    // 获取设备唯一标识符作为客户端ID
    let client_id = hostname::get()
        .unwrap_or_else(|_| "unknown-host".into())
        .to_string_lossy()
        .to_string();
    
    let mut config = RemoteControlConfig::default();
    config.client_id = client_id;
    
    info!("使用默认远程控制配置");
    debug!("远程控制配置: {:?}", config);
    
    Ok(config)
}

// 远程控制命令类型
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum RemoteCommandType {
    LockScreen,           // 锁定屏幕
    Shutdown,             // 关机
    // 可以根据需要添加更多命令类型
}

// 远程控制命令
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RemoteCommand {
    pub id: String,                // 命令ID
    pub type_: RemoteCommandType,  // 命令类型
    pub params: Option<serde_json::Value>, // 命令参数
    pub timestamp: String,         // 命令时间戳
}

// 命令执行结果
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CommandResult {
    pub command_id: String,        // 命令ID
    pub success: bool,             // 是否成功
    pub message: String,           // 结果消息
    pub timestamp: String,         // 执行时间戳
    pub client_id: String,         // 客户端ID
}

// WebSocket客户端状态
pub struct WebSocketClient {
    ws_stream: Option<WebSocketStream<MaybeTlsStream<TcpStream>>>,
    config: RemoteControlConfig,
    app_handle: AppHandle,
}

impl WebSocketClient {
    pub fn new(config: RemoteControlConfig, app_handle: AppHandle) -> Self {
        Self {
            ws_stream: None,
            config,
            app_handle,
        }
    }

    // 连接到WebSocket服务器
    async fn connect(&mut self) -> Result<()> {
        info!("正在连接到远程控制服务器: {}", self.config.server_url);
        
        // 构建带有认证信息的URL
        let connect_url = format!("{}?token={}&client_id={}", 
            self.config.server_url, self.config.auth_token, self.config.client_id);
        
        match connect_async(&connect_url).await {
            Ok((ws_stream, _)) => {
                info!("已成功连接到远程控制服务器");
                self.ws_stream = Some(ws_stream);
                Ok(())
            }
            Err(e) => {
                error!("连接到远程控制服务器失败: {}", e);
                Err(anyhow::anyhow!("连接失败: {}", e))
            }
        }
    }

    // 发送心跳包
    #[allow(dead_code)]
    async fn send_heartbeat(&mut self) -> Result<()> {
        if let Some(ws_stream) = &mut self.ws_stream {
            let heartbeat = serde_json::json!({
                "type": "heartbeat",
                "client_id": self.config.client_id,
                "timestamp": chrono::Utc::now().to_rfc3339(),
            });
            
            let message = Message::Text(serde_json::to_string(&heartbeat)?);
            ws_stream.send(message).await?;
            debug!("已发送心跳包");
            Ok(())
        } else {
            Err(anyhow::anyhow!("WebSocket连接未建立"))
        }
    }

    // 发送命令执行结果
    #[allow(dead_code)]
    async fn send_command_result(&mut self, result: CommandResult) -> Result<()> {
        if let Some(ws_stream) = &mut self.ws_stream {
            let message = Message::Text(serde_json::to_string(&result)?);
            ws_stream.send(message).await?;
            info!("已发送命令执行结果: {:?}", result);
            Ok(())
        } else {
            Err(anyhow::anyhow!("WebSocket连接未建立"))
        }
    }

    // 处理接收到的命令
    #[allow(dead_code)]
    async fn handle_command(&mut self, command: RemoteCommand) -> Result<()> {
        info!("收到远程命令: {:?}", command);
        
        // 检查命令是否启用
        let result = match command.type_ {
            RemoteCommandType::LockScreen => {
                if self.config.commands.lock_screen_enabled {
                    self.execute_lock_screen().await
                } else {
                    Err(anyhow::anyhow!("锁屏命令未启用"))
                }
            },
            RemoteCommandType::Shutdown => {
                if self.config.commands.shutdown_enabled {
                    self.execute_shutdown(&command).await
                } else {
                    Err(anyhow::anyhow!("关机命令未启用"))
                }
            },
        };
        
        // 构建命令执行结果
        let command_result = CommandResult {
            command_id: command.id,
            success: result.is_ok(),
            message: result.unwrap_or_else(|e| e.to_string()),
            timestamp: chrono::Utc::now().to_rfc3339(),
            client_id: self.config.client_id.clone(),
        };
        
        // 发送命令执行结果
        self.send_command_result(command_result).await?;
        
        Ok(())
    }

    // 执行锁屏命令
    #[allow(dead_code)]
    async fn execute_lock_screen(&self) -> Result<String> {
        info!("执行锁屏命令");
        
        // 检查系统控制权限
        let system_control_permission = check_system_control_permission();
        if !matches!(system_control_permission, OSPermissionStatus::Granted | OSPermissionStatus::NotNeeded) {
            return Err(anyhow::anyhow!("锁屏命令需要系统控制权限，但权限未授予"));
        }
        
        match std::env::consts::OS {
            "windows" => {
                // Windows 锁屏命令
                let output = Command::new("rundll32.exe")
                    .args(&["user32.dll,LockWorkStation"])
                    .output()
                    .context("执行Windows锁屏命令失败")?;
                
                if output.status.success() {
                    Ok("锁屏成功".to_string())
                } else {
                    let error = String::from_utf8_lossy(&output.stderr);
                    Err(anyhow::anyhow!("锁屏失败: {}", error))
                }
            },
            "macos" => {
                // macOS 锁屏命令
                let output = Command::new("osascript")
                    .args(&["-e", "tell application \"System Events\" to keystroke \"q\" using {command down, control down}"])
                    .output()
                    .context("执行macOS锁屏命令失败")?;
                
                if output.status.success() {
                    Ok("锁屏成功".to_string())
                } else {
                    let error = String::from_utf8_lossy(&output.stderr);
                    Err(anyhow::anyhow!("锁屏失败: {}", error))
                }
            },
            "linux" => {
                // Linux 锁屏命令 (适用于 GNOME)
                let output = Command::new("dbus-send")
                    .args(&["--type=method_call", "--dest=org.gnome.ScreenSaver", "/org/gnome/ScreenSaver", "org.gnome.ScreenSaver.Lock"])
                    .output()
                    .context("执行Linux锁屏命令失败")?;
                
                if output.status.success() {
                    Ok("锁屏成功".to_string())
                } else {
                    let error = String::from_utf8_lossy(&output.stderr);
                    Err(anyhow::anyhow!("锁屏失败: {}", error))
                }
            },
            _ => Err(anyhow::anyhow!("不支持的操作系统"))
        }
    }

    // 执行关机命令
    #[allow(dead_code)]
    async fn execute_shutdown(&self, command: &RemoteCommand) -> Result<String> {
        info!("执行关机命令");
        
        // 检查系统控制权限
        let system_control_permission = check_system_control_permission();
        if !matches!(system_control_permission, OSPermissionStatus::Granted | OSPermissionStatus::NotNeeded) {
            return Err(anyhow::anyhow!("关机命令需要系统控制权限，但权限未授予"));
        }
        
        // 从参数中获取延迟时间（秒）
        let delay_seconds = if let Some(params) = &command.params {
            params.get("delay_seconds")
                .and_then(|v| v.as_u64())
                .unwrap_or(0)
        } else {
            0
        };
        
        match std::env::consts::OS {
            "windows" => {
                // Windows 关机命令
                let delay_str = delay_seconds.to_string();
                let args = if delay_seconds > 0 {
                    vec!["/s", "/t", &delay_str]
                } else {
                    vec!["/s", "/t", "0"]
                };
                
                let output = Command::new("shutdown")
                    .args(&args)
                    .output()
                    .context("执行Windows关机命令失败")?;
                
                if output.status.success() {
                    Ok("关机命令已执行".to_string())
                } else {
                    let error = String::from_utf8_lossy(&output.stderr);
                    Err(anyhow::anyhow!("关机失败: {}", error))
                }
            },
            "macos" => {
                // macOS 关机命令
                let delay_format = if delay_seconds > 0 {
                    format!("+{}", delay_seconds / 60)
                } else {
                    "now".to_string()
                };
                
                let args = vec!["-h", &delay_format];
                
                let output = Command::new("shutdown")
                    .args(&args)
                    .output()
                    .context("执行macOS关机命令失败")?;
                
                if output.status.success() {
                    Ok("关机命令已执行".to_string())
                } else {
                    let error = String::from_utf8_lossy(&output.stderr);
                    Err(anyhow::anyhow!("关机失败: {}", error))
                }
            },
            "linux" => {
                // Linux 关机命令
                let delay_format = if delay_seconds > 0 {
                    format!("+{}", delay_seconds / 60)
                } else {
                    "now".to_string()
                };
                
                let args = vec!["-h", &delay_format];
                
                let output = Command::new("shutdown")
                    .args(&args)
                    .output()
                    .context("执行Linux关机命令失败")?;
                
                if output.status.success() {
                    Ok("关机命令已执行".to_string())
                } else {
                    let error = String::from_utf8_lossy(&output.stderr);
                    Err(anyhow::anyhow!("关机失败: {}", error))
                }
            },
            _ => Err(anyhow::anyhow!("不支持的操作系统"))
        }
    }

    // 启动WebSocket客户端
    pub async fn start(&mut self) {
        info!("启动远程控制WebSocket客户端");
        
        // 获取重连间隔
        let reconnect_interval = Duration::from_secs(self.config.reconnect_interval_secs);
        
        loop {
            // 尝试连接
            if self.ws_stream.is_none() {
                if let Err(e) = self.connect().await {
                    error!("连接失败，将在 {} 秒后重试: {}", reconnect_interval.as_secs(), e);
                    time::sleep(reconnect_interval).await;
                    continue;
                }
            }
            
            // 处理WebSocket消息
            if let Some(ws_stream) = self.ws_stream.take() {
                let (tx, mut rx) = tokio::sync::mpsc::channel::<Message>(100);
                let (write, mut read) = ws_stream.split();
                
                // 创建发送任务
                let write_task = {
                    let mut write = write;
                    tokio::spawn(async move {
                        while let Some(msg) = rx.recv().await {
                            if let Err(e) = write.send(msg).await {
                                error!("发送WebSocket消息失败: {}", e);
                                break;
                            }
                        }
                    })
                };
                
                // 发送初始连接消息
                let connect_msg = json!({
                    "type": "connect",
                    "client_id": self.config.client_id,
                    "timestamp": chrono::Utc::now().to_rfc3339(),
                    "platform": std::env::consts::OS,
                    "version": env!("CARGO_PKG_VERSION"),
                });
                
                if let Err(e) = tx.send(Message::Text(serde_json::to_string(&connect_msg).unwrap())).await {
                    error!("发送连接消息失败: {}", e);
                    continue;
                }
                
                // 创建心跳任务
                let heartbeat_interval = Duration::from_secs(self.config.heartbeat_interval_secs);
                let client_id = self.config.client_id.clone();
                let tx_clone = tx.clone();
                
                let heartbeat_task = tokio::spawn(async move {
                    let mut interval = time::interval(heartbeat_interval);
                    loop {
                        interval.tick().await;
                        let heartbeat = json!({
                            "type": "heartbeat",
                            "client_id": client_id,
                            "timestamp": chrono::Utc::now().to_rfc3339(),
                            "platform": std::env::consts::OS,
                            "version": env!("CARGO_PKG_VERSION"),
                        });
                        
                        if let Err(e) = tx_clone.send(Message::Text(serde_json::to_string(&heartbeat).unwrap())).await {
                            error!("发送心跳包失败: {}", e);
                            break;
                        }
                        debug!("已发送心跳包");
                    }
                });
                
                // 处理接收到的消息
                let app_handle = self.app_handle.clone();
                let config = self.config.clone();
                let tx_for_commands = tx.clone();
                
                while let Some(message) = read.next().await {
                    match message {
                        Ok(Message::Text(text)) => {
                            debug!("收到消息: {}", text);
                            
                            // 先尝试解析为通用消息格式，检查消息类型
                            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
                                // 检查是否是心跳响应或其他非命令消息
                                if let Some(msg_type) = json.get("type").and_then(|t| t.as_str()) {
                                    if msg_type == "heartbeat_ack" || msg_type == "welcome" {
                                        debug!("收到系统消息: {}", msg_type);
                                        continue;
                                    }
                                }
                            }
                            
                            // 解析命令
                            match serde_json::from_str::<RemoteCommand>(&text) {
                                Ok(command) => {
                                    let command_id = command.id.clone();
                                    let client_id = config.client_id.clone();
                                    let app_handle_clone = app_handle.clone();
                                    let config_clone = config.clone();
                                    let tx_clone = tx_for_commands.clone();
                                    
                                    // 在单独的任务中处理命令
                                    tokio::spawn(async move {
                                        let result = match &command.type_ {
                                            RemoteCommandType::LockScreen => {
                                                if config_clone.commands.lock_screen_enabled {
                                                    // 执行锁屏命令
                                                    execute_lock_screen(&app_handle_clone).await
                                                } else {
                                                    Err(anyhow::anyhow!("锁屏命令未启用"))
                                                }
                                            },
                                            RemoteCommandType::Shutdown => {
                                                if config_clone.commands.shutdown_enabled {
                                                    // 执行关机命令
                                                    execute_shutdown_command(&command).await
                                                } else {
                                                    Err(anyhow::anyhow!("关机命令未启用"))
                                                }
                                            },
                                        };
                                        
                                        // 构建命令执行结果
                                        let command_result = CommandResult {
                                            command_id,
                                            success: result.is_ok(),
                                            message: result.unwrap_or_else(|e| e.to_string()),
                                            timestamp: chrono::Utc::now().to_rfc3339(),
                                            client_id,
                                        };
                                        
                                        // 发送命令执行结果
                                        let result_json = json!({
                                            "type": "command_result",
                                            "result": command_result
                                        });
                                        
                                        if let Err(e) = tx_clone.send(Message::Text(serde_json::to_string(&result_json).unwrap())).await {
                                            error!("发送命令结果失败: {}", e);
                                        }
                                    });
                                }
                                Err(e) => {
                                    error!("解析命令失败: {}", e);
                                }
                            }
                        }
                        Ok(Message::Ping(data)) => {
                            // 自动回复Pong
                            if let Err(e) = tx.send(Message::Pong(data)).await {
                                error!("发送Pong响应失败: {}", e);
                            }
                        }
                        Ok(Message::Close(_)) => {
                            info!("服务器关闭了连接");
                            break;
                        }
                        Err(e) => {
                            error!("WebSocket错误: {}", e);
                            break;
                        }
                        _ => {}
                    }
                }
                
                // 取消心跳任务和写入任务
                heartbeat_task.abort();
                write_task.abort();
            }
            
            // 如果连接断开，等待一段时间后重连
            info!("WebSocket连接断开，将在 {} 秒后重连", reconnect_interval.as_secs());
            self.ws_stream = None;
            time::sleep(reconnect_interval).await;
        }
    }
}

// 远程控制服务状态
pub struct RemoteControlState(pub Arc<Mutex<Option<WebSocketClient>>>);

// 启动远程控制服务
pub async fn start_remote_control(
    app_handle: AppHandle,
    config: RemoteControlConfig,
) -> Result<RemoteControlState> {
    info!("启动远程控制服务");
    
    // 检查系统控制权限
    let system_control_permission = check_system_control_permission();
    if !matches!(system_control_permission, OSPermissionStatus::Granted | OSPermissionStatus::NotNeeded) {
        info!("远程控制功能需要系统控制权限，但权限未授予");
        // 我们仍然启动服务，但在执行命令时会检查权限
    }
    
    let client = WebSocketClient::new(config, app_handle.clone());
    
    // 创建一个共享状态
    let state = RemoteControlState(Arc::new(Mutex::new(Some(client))));
    let state_clone = state.0.clone();
    
    // 在后台任务中启动WebSocket客户端
    tokio::spawn(async move {
        if let Some(mut client) = state_clone.lock().await.take() {
            client.start().await;
        }
    });
    
    Ok(state)
}

// 停止远程控制服务
pub async fn stop_remote_control(state: &RemoteControlState) -> Result<()> {
    info!("停止远程控制服务");
    
    let mut client_opt = state.0.lock().await;
    *client_opt = None;
    
    Ok(())
}

// 执行锁屏命令（独立函数）
async fn execute_lock_screen(_app_handle: &AppHandle) -> Result<String> {
    info!("执行锁屏命令");
    
    // 检查系统控制权限
    let system_control_permission = check_system_control_permission();
    if !matches!(system_control_permission, OSPermissionStatus::Granted | OSPermissionStatus::NotNeeded) {
        return Err(anyhow::anyhow!("锁屏命令需要系统控制权限，但权限未授予"));
    }
    
    match std::env::consts::OS {
        "windows" => {
            // Windows 锁屏命令
            let output = Command::new("rundll32.exe")
                .args(&["user32.dll,LockWorkStation"])
                .output()
                .context("执行Windows锁屏命令失败")?;
            
            if output.status.success() {
                Ok("锁屏成功".to_string())
            } else {
                let error = String::from_utf8_lossy(&output.stderr);
                Err(anyhow::anyhow!("锁屏失败: {}", error))
            }
        },
        "macos" => {
            // macOS 锁屏命令
            let output = Command::new("osascript")
                .args(&["-e", "tell application \"System Events\" to keystroke \"q\" using {command down, control down}"])
                .output()
                .context("执行macOS锁屏命令失败")?;
            
            if output.status.success() {
                Ok("锁屏成功".to_string())
            } else {
                let error = String::from_utf8_lossy(&output.stderr);
                Err(anyhow::anyhow!("锁屏失败: {}", error))
            }
        },
        "linux" => {
            // Linux 锁屏命令 (适用于 GNOME)
            let output = Command::new("dbus-send")
                .args(&["--type=method_call", "--dest=org.gnome.ScreenSaver", "/org/gnome/ScreenSaver", "org.gnome.ScreenSaver.Lock"])
                .output()
                .context("执行Linux锁屏命令失败")?;
            
            if output.status.success() {
                Ok("锁屏成功".to_string())
            } else {
                let error = String::from_utf8_lossy(&output.stderr);
                Err(anyhow::anyhow!("锁屏失败: {}", error))
            }
        },
        _ => Err(anyhow::anyhow!("不支持的操作系统"))
    }
}

// 执行关机命令（独立函数）
async fn execute_shutdown_command(command: &RemoteCommand) -> Result<String> {
    info!("执行关机命令");
    
    // 检查系统控制权限
    let system_control_permission = check_system_control_permission();
    if !matches!(system_control_permission, OSPermissionStatus::Granted | OSPermissionStatus::NotNeeded) {
        return Err(anyhow::anyhow!("关机命令需要系统控制权限，但权限未授予"));
    }
    
    // 从参数中获取延迟时间（秒）
    let delay_seconds = if let Some(params) = &command.params {
        params.get("delay_seconds")
            .and_then(|v| v.as_u64())
            .unwrap_or(0)
    } else {
        0
    };
    
    match std::env::consts::OS {
        "windows" => {
            // Windows 关机命令
            let delay_str = delay_seconds.to_string();
            let args = if delay_seconds > 0 {
                vec!["/s", "/t", &delay_str]
            } else {
                vec!["/s", "/t", "0"]
            };
            
            let output = Command::new("shutdown")
                .args(&args)
                .output()
                .context("执行Windows关机命令失败")?;
            
            if output.status.success() {
                Ok("关机命令已执行".to_string())
            } else {
                let error = String::from_utf8_lossy(&output.stderr);
                Err(anyhow::anyhow!("关机失败: {}", error))
            }
        },
        "macos" => {
            // macOS 关机命令
            let delay_format = if delay_seconds > 0 {
                format!("+{}", delay_seconds / 60)
            } else {
                "now".to_string()
            };
            
            let args = vec!["-h", &delay_format];
            
            let output = Command::new("shutdown")
                .args(&args)
                .output()
                .context("执行macOS关机命令失败")?;
            
            if output.status.success() {
                Ok("关机命令已执行".to_string())
            } else {
                let error = String::from_utf8_lossy(&output.stderr);
                Err(anyhow::anyhow!("关机失败: {}", error))
            }
        },
        "linux" => {
            // Linux 关机命令
            let delay_format = if delay_seconds > 0 {
                format!("+{}", delay_seconds / 60)
            } else {
                "now".to_string()
            };
            
            let args = vec!["-h", &delay_format];
            
            let output = Command::new("shutdown")
                .args(&args)
                .output()
                .context("执行Linux关机命令失败")?;
            
            if output.status.success() {
                Ok("关机命令已执行".to_string())
            } else {
                let error = String::from_utf8_lossy(&output.stderr);
                Err(anyhow::anyhow!("关机失败: {}", error))
            }
        },
        _ => Err(anyhow::anyhow!("不支持的操作系统"))
    }
} 
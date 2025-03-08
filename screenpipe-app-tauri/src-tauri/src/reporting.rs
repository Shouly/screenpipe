use anyhow::{Context, Result};
use chrono::{DateTime, Duration, Utc};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Arc;
use std::time::Duration as StdDuration;
use tokio::sync::Mutex;
use tokio::time;
use tracing::{debug, error, info};
use rusqlite;
use dirs;
use hostname;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReportingConfig {
    // 目标Web服务URL
    pub web_service_url: String,
    // 认证令牌
    pub auth_token: String,
    // 上报间隔（分钟）
    pub report_interval_minutes: u64,
    // 上报数据类型
    pub data_types: DataTypes,
    // 上次上报时间
    pub last_report_time: Option<String>,
    // 安全缓冲区（秒）
    pub safety_buffer_seconds: u64,
    // 重试设置
    pub retry: RetryConfig,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DataTypes {
    pub frames: bool,
    pub ocr_text: bool,
    pub audio_transcriptions: bool,
    pub ui_monitoring: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RetryConfig {
    pub max_attempts: u32,
    pub initial_backoff_seconds: u64,
    pub max_backoff_seconds: u64,
}

impl Default for ReportingConfig {
    fn default() -> Self {
        Self {
            web_service_url: "http://localhost:8000/api/v1/data/report".to_string(),
            auth_token: "".to_string(),
            report_interval_minutes: 1, // 默认每分钟上报一次
            data_types: DataTypes {
                frames: true,
                ocr_text: true,
                audio_transcriptions: true,
                ui_monitoring: true,
            },
            last_report_time: None,
            safety_buffer_seconds: 30, // 默认30秒安全缓冲区
            retry: RetryConfig {
                max_attempts: 5,
                initial_backoff_seconds: 30,
                max_backoff_seconds: 3600, // 最大1小时
            },
        }
    }
}

pub struct ReportingService {
    config: Arc<Mutex<ReportingConfig>>,
    client: Client,
    is_reporting: Arc<Mutex<bool>>,
}

impl ReportingService {
    pub fn new(config: ReportingConfig) -> Self {
        Self {
            config: Arc::new(Mutex::new(config)),
            client: Client::new(),
            is_reporting: Arc::new(Mutex::new(false)),
        }
    }

    // 启动定时上报服务
    pub async fn start_scheduler(&self) -> Result<()> {
        let config = self.config.lock().await.clone();
        let interval = StdDuration::from_secs(config.report_interval_minutes * 60);
        
        info!("启动上报调度器，上报间隔: {}分钟，安全缓冲区: {}秒", 
              config.report_interval_minutes, config.safety_buffer_seconds);
        debug!("上报配置: {:?}", config);
        
        // 初始化上次上报时间为当前时间减去2分钟（如果未设置）
        if config.last_report_time.is_none() {
            let mut config = self.config.lock().await;
            let initial_time = Utc::now() - Duration::minutes(2);
            config.last_report_time = Some(initial_time.to_rfc3339());
            info!("初始化上次上报时间为: {}", initial_time);
        }
        
        let config_arc = self.config.clone();
        let is_reporting_arc = self.is_reporting.clone();
        let client = self.client.clone();
        
        // 启动定时任务
        tokio::spawn(async move {
            let mut interval_timer = time::interval(interval);
            
            info!("上报服务已启动，等待第一次定时触发");
            
            loop {
                interval_timer.tick().await;
                
                info!("定时器触发，准备执行上报任务");
                
                // 检查是否已经在上报中
                let mut is_reporting = is_reporting_arc.lock().await;
                if *is_reporting {
                    info!("跳过本次上报，因为另一个上报任务正在进行中");
                    continue;
                }
                
                *is_reporting = true;
                drop(is_reporting);
                
                let config = config_arc.lock().await.clone();
                
                // 计算上报时间窗口
                let now = Utc::now();
                let safety_buffer = Duration::seconds(config.safety_buffer_seconds as i64);
                let end_time = now - safety_buffer;
                
                let start_time = match config.last_report_time {
                    Some(ref time_str) => {
                        match DateTime::parse_from_rfc3339(time_str) {
                            Ok(time) => time.with_timezone(&Utc),
                            Err(e) => {
                                error!("解析上次上报时间失败: {}, 使用1小时前作为起始时间", e);
                                end_time - Duration::hours(1)
                            }
                        }
                    },
                    None => end_time - Duration::hours(1)
                };
                
                info!("上报时间窗口: {} 到 {}", start_time, end_time);
                
                // 检查时间窗口是否有效
                if start_time >= end_time {
                    info!("上报时间窗口无效，跳过本次上报");
                    let mut is_reporting = is_reporting_arc.lock().await;
                    *is_reporting = false;
                    continue;
                }
                
                info!("开始执行上报任务，目标URL: {}", config.web_service_url);
                
                match Self::perform_report(&client, &config, &start_time.to_rfc3339(), &end_time.to_rfc3339()).await {
                    Ok(()) => {
                        // 更新上次上报时间
                        let mut config = config_arc.lock().await;
                        config.last_report_time = Some(end_time.to_rfc3339());
                        // TODO: 保存更新后的配置
                        info!("上报任务成功完成，更新上次上报时间为: {}", end_time);
                    }
                    Err(e) => {
                        error!("上报任务失败: {}", e);
                    }
                }
                
                // 重置上报状态
                let mut is_reporting = is_reporting_arc.lock().await;
                *is_reporting = false;
                info!("上报状态已重置，等待下一次定时触发");
            }
        });
        
        Ok(())
    }
    
    // 执行数据上报
    async fn perform_report(client: &Client, config: &ReportingConfig, start_time: &str, end_time: &str) -> Result<()> {
        info!("开始执行数据上报到 {}", config.web_service_url);
        info!("上报时间窗口: {} 到 {}", start_time, end_time);
        
        // 收集数据
        info!("开始收集上报数据");
        let data = Self::collect_data(config, start_time, end_time).await?;
        
        // 检查是否有数据需要上报
        if Self::is_data_empty(&data) {
            info!("没有新数据需要上报，跳过本次上报");
            return Ok(());
        }
        
        info!("数据收集完成，准备构建请求体");
        
        // 构建请求体
        let body = json!({
            "clientId": Self::get_client_id().await?,
            "timestamp": Utc::now().to_rfc3339(),
            "reportType": "incremental",
            "dataVersion": "1.0",
            "data": data,
            "metadata": {
                "appVersion": env!("CARGO_PKG_VERSION"),
                "platform": Self::get_platform(),
                "reportingPeriod": {
                    "start": start_time,
                    "end": end_time
                },
                "systemInfo": Self::get_system_info().await?
            }
        });
        
        // 打印完整的上报数据
        info!("完整的上报数据: \n{}", serde_json::to_string_pretty(&body).unwrap_or_default());
        debug!("请求体构建完成: {}", serde_json::to_string_pretty(&body).unwrap_or_default());
        
        // 发送请求
        let mut attempt = 0;
        let mut backoff = config.retry.initial_backoff_seconds;
        
        while attempt < config.retry.max_attempts {
            info!("开始发送上报请求，尝试 {}/{}", attempt + 1, config.retry.max_attempts);
            
            let result = client
                .post(&config.web_service_url)
                .header("Authorization", format!("Bearer {}", config.auth_token))
                .header("Content-Type", "application/json")
                .header("User-Agent", format!("Screenpipe/{}", env!("CARGO_PKG_VERSION")))
                .json(&body)
                .send()
                .await;
                
            match result {
                Ok(response) => {
                    if response.status().is_success() {
                        info!("上报请求发送成功，服务器返回状态码: {}", response.status());
                        return Ok(());
                    } else {
                        let status = response.status();
                        let error_text = response.text().await.unwrap_or_default();
                        error!("上报请求失败。状态码: {}, 错误信息: {}", status, error_text);
                    }
                }
                Err(e) => {
                    error!("上报请求发送错误: {}", e);
                }
            }
            
            // 重试前等待
            attempt += 1;
            if attempt < config.retry.max_attempts {
                info!("将在 {} 秒后重试 (尝试 {}/{})", backoff, attempt + 1, config.retry.max_attempts);
                time::sleep(StdDuration::from_secs(backoff)).await;
                
                // 指数退避
                backoff = std::cmp::min(backoff * 2, config.retry.max_backoff_seconds);
            }
        }
        
        Err(anyhow::anyhow!("在 {} 次尝试后上报失败", config.retry.max_attempts))
    }
    
    // 检查数据是否为空
    fn is_data_empty(data: &serde_json::Value) -> bool {
        if let Some(obj) = data.as_object() {
            for (_, value) in obj {
                if let Some(arr) = value.as_array() {
                    if !arr.is_empty() {
                        return false;
                    }
                }
            }
            return true;
        }
        true
    }
    
    // 收集需要上报的数据
    async fn collect_data(config: &ReportingConfig, start_time: &str, end_time: &str) -> Result<serde_json::Value> {
        info!("开始收集上报数据，时间窗口: {} 到 {}", start_time, end_time);
        let mut data = json!({});
        
        // 根据配置收集不同类型的数据
        if config.data_types.frames {
            info!("收集帧数据和OCR文本");
            let frames_data = Self::collect_frames_with_ocr(start_time, end_time).await?;
            data["frames"] = frames_data.clone();
            info!("收集到 {} 条帧数据", frames_data.as_array().map_or(0, |arr| arr.len()));
            debug!("帧数据详情: \n{}", serde_json::to_string_pretty(&frames_data).unwrap_or_default());
        }
        
        if config.data_types.audio_transcriptions {
            info!("收集音频转录数据");
            let audio_data = Self::collect_audio_transcriptions(start_time, end_time).await?;
            data["audioTranscriptions"] = audio_data.clone();
            info!("收集到 {} 条音频转录数据", audio_data.as_array().map_or(0, |arr| arr.len()));
            debug!("音频转录数据详情: \n{}", serde_json::to_string_pretty(&audio_data).unwrap_or_default());
        }
        
        if config.data_types.ui_monitoring {
            info!("收集UI监控数据");
            let ui_data = Self::collect_ui_monitoring(start_time, end_time).await?;
            data["uiMonitoring"] = ui_data.clone();
            info!("收集到 {} 条UI监控数据", ui_data.as_array().map_or(0, |arr| arr.len()));
            debug!("UI监控数据详情: \n{}", serde_json::to_string_pretty(&ui_data).unwrap_or_default());
        }
        
        info!("数据收集完成");
        info!("收集到的数据统计: 帧数据: {}, 音频转录: {}, UI监控: {}", 
            data["frames"].as_array().map_or(0, |arr| arr.len()),
            data["audioTranscriptions"].as_array().map_or(0, |arr| arr.len()),
            data["uiMonitoring"].as_array().map_or(0, |arr| arr.len())
        );
        debug!("收集到的数据: {}", serde_json::to_string_pretty(&data).unwrap_or_default());
        
        Ok(data)
    }
    
    // 获取数据库连接
    fn get_db_connection() -> Result<rusqlite::Connection> {
        let home_dir = dirs::home_dir().context("failed to get home directory")?;
        let db_path = home_dir.join(".screenpipe").join("db.sqlite");
        
        rusqlite::Connection::open(db_path).context("failed to open database connection")
    }
    
    // 收集帧数据和关联的OCR文本
    async fn collect_frames_with_ocr(start_time: &str, end_time: &str) -> Result<serde_json::Value> {
        let start_time = start_time.to_string();
        let end_time = end_time.to_string();
        
        let result = tokio::task::spawn_blocking(move || -> Result<serde_json::Value> {
            let conn = Self::get_db_connection()?;
            
            // 查询帧数据，包括app_name、window_name和focused字段
            let mut stmt = conn.prepare(
                "SELECT f.id, f.video_chunk_id, f.offset_index, f.timestamp, f.name, f.browser_url, 
                        f.app_name, f.window_name, f.focused
                 FROM frames f 
                 WHERE f.timestamp > ?1 AND f.timestamp <= ?2 
                 ORDER BY f.timestamp ASC"
            ).context("failed to prepare frames statement")?;
            
            let frame_rows = stmt.query_map([&start_time, &end_time], |row| {
                Ok((
                    row.get::<_, i64>(0)?, // id
                    row.get::<_, i64>(1)?, // video_chunk_id
                    row.get::<_, i64>(2)?, // offset_index
                    row.get::<_, String>(3)?, // timestamp
                    row.get::<_, Option<String>>(4)?, // name
                    row.get::<_, Option<String>>(5)?, // browser_url
                    row.get::<_, Option<String>>(6)?, // app_name
                    row.get::<_, Option<String>>(7)?, // window_name
                    row.get::<_, Option<bool>>(8)?, // focused
                ))
            }).context("failed to execute frames query")?;
            
            let mut frames = Vec::new();
            for frame_row in frame_rows {
                let (id, video_chunk_id, offset_index, timestamp, name, browser_url, app_name, window_name, focused) = frame_row?;
                
                // 查询关联的OCR文本，不再包含app_name、window_name和focused字段
                let mut ocr_stmt = conn.prepare(
                    "SELECT text, text_json, ocr_engine, text_length 
                     FROM ocr_text 
                     WHERE frame_id = ?"
                ).context("failed to prepare ocr statement")?;
                
                let ocr_rows = ocr_stmt.query_map([id], |row| {
                    Ok(json!({
                        "text": row.get::<_, String>(0)?,
                        "text_json": row.get::<_, String>(1)?,
                        "ocr_engine": row.get::<_, String>(2)?,
                        "text_length": row.get::<_, Option<i64>>(3)?
                    }))
                }).context("failed to execute ocr query")?;
                
                let mut ocr_data = None;
                for ocr_row in ocr_rows {
                    ocr_data = Some(ocr_row?);
                    break; // 只取第一条OCR记录，因为一个帧通常只有一条OCR记录
                }
                
                frames.push(json!({
                    "id": id,
                    "video_chunk_id": video_chunk_id,
                    "offset_index": offset_index,
                    "timestamp": timestamp,
                    "name": name,
                    "browser_url": browser_url,
                    "app_name": app_name,
                    "window_name": window_name,
                    "focused": focused,
                    "ocr_text": ocr_data
                }));
            }
            
            Ok(json!(frames))
        }).await.context("failed to spawn blocking task")??;
        
        Ok(result)
    }
    
    // 收集音频转录数据
    async fn collect_audio_transcriptions(start_time: &str, end_time: &str) -> Result<serde_json::Value> {
        let start_time = start_time.to_string();
        let end_time = end_time.to_string();
        
        let result = tokio::task::spawn_blocking(move || -> Result<serde_json::Value> {
            let conn = Self::get_db_connection()?;
            
            let mut stmt = conn.prepare(
                "SELECT id, audio_chunk_id, offset_index, timestamp, transcription, 
                        device, is_input_device, speaker_id, transcription_engine, 
                        start_time, end_time, text_length 
                 FROM audio_transcriptions 
                 WHERE timestamp > ?1 AND timestamp <= ?2 
                 ORDER BY timestamp ASC"
            ).context("failed to prepare audio_transcriptions statement")?;
            
            let rows = stmt.query_map([&start_time, &end_time], |row| {
                Ok(json!({
                    "id": row.get::<_, i64>(0)?,
                    "audio_chunk_id": row.get::<_, i64>(1)?,
                    "offset_index": row.get::<_, i64>(2)?,
                    "timestamp": row.get::<_, String>(3)?,
                    "transcription": row.get::<_, String>(4)?,
                    "device": row.get::<_, String>(5)?,
                    "is_input_device": row.get::<_, bool>(6)?,
                    "speaker_id": row.get::<_, Option<i64>>(7)?,
                    "transcription_engine": row.get::<_, String>(8)?,
                    "start_time": row.get::<_, Option<f64>>(9)?,
                    "end_time": row.get::<_, Option<f64>>(10)?,
                    "text_length": row.get::<_, Option<i64>>(11)?
                }))
            }).context("failed to execute audio_transcriptions query")?;
            
            let mut transcriptions = Vec::new();
            for row in rows {
                transcriptions.push(row?);
            }
            
            Ok(json!(transcriptions))
        }).await.context("failed to spawn blocking task")??;
        
        Ok(result)
    }
    
    // 收集UI监控数据
    async fn collect_ui_monitoring(start_time: &str, end_time: &str) -> Result<serde_json::Value> {
        let start_time = start_time.to_string();
        let end_time = end_time.to_string();
        
        let result = tokio::task::spawn_blocking(move || -> Result<serde_json::Value> {
            let conn = Self::get_db_connection()?;
            
            let mut stmt = conn.prepare(
                "SELECT id, text_output, timestamp, app, window, initial_traversal_at, text_length 
                 FROM ui_monitoring 
                 WHERE timestamp > ?1 AND timestamp <= ?2 
                 ORDER BY timestamp ASC"
            ).context("failed to prepare ui_monitoring statement")?;
            
            let rows = stmt.query_map([&start_time, &end_time], |row| {
                Ok(json!({
                    "id": row.get::<_, i64>(0)?,
                    "text_output": row.get::<_, String>(1)?,
                    "timestamp": row.get::<_, String>(2)?,
                    "app": row.get::<_, String>(3)?,
                    "window": row.get::<_, String>(4)?,
                    "initial_traversal_at": row.get::<_, Option<String>>(5)?,
                    "text_length": row.get::<_, Option<i64>>(6)?
                }))
            }).context("failed to execute ui_monitoring query")?;
            
            let mut monitoring_data = Vec::new();
            for row in rows {
                monitoring_data.push(row?);
            }
            
            Ok(json!(monitoring_data))
        }).await.context("failed to spawn blocking task")??;
        
        Ok(result)
    }
    
    // 获取系统信息
    async fn get_system_info() -> Result<serde_json::Value> {
        // 获取设备信息
        let result = tokio::task::spawn_blocking(move || -> Result<serde_json::Value> {
            let conn = Self::get_db_connection()?;
            
            // 获取监视器数量
            let mut stmt = conn.prepare(
                "SELECT COUNT(DISTINCT device_name) FROM video_chunks"
            ).context("failed to prepare monitor count statement")?;
            
            let monitor_count: i64 = stmt.query_row([], |row| row.get(0))
                .unwrap_or(0);
            
            // 获取音频设备数量
            let mut stmt = conn.prepare(
                "SELECT COUNT(DISTINCT device) FROM audio_transcriptions"
            ).context("failed to prepare audio device count statement")?;
            
            let audio_device_count: i64 = stmt.query_row([], |row| row.get(0))
                .unwrap_or(0);
            
            // 获取应用数量
            let mut stmt = conn.prepare(
                "SELECT COUNT(DISTINCT app_name) FROM frames WHERE app_name IS NOT NULL AND app_name != ''"
            ).context("failed to prepare app count statement")?;
            
            let app_count: i64 = stmt.query_row([], |row| row.get(0))
                .unwrap_or(0);
            
            // 使用 hostname 库获取主机名
            let hostname = hostname::get()
                .map(|h| h.to_string_lossy().to_string())
                .unwrap_or_default();
            
            let system_info = json!({
                "os": Self::get_platform(),
                "osVersion": std::env::consts::OS,
                "monitorCount": monitor_count,
                "audioDeviceCount": audio_device_count,
                "applicationCount": app_count,
                "hostname": hostname
            });
            
            info!("系统信息: \n{}", serde_json::to_string_pretty(&system_info).unwrap_or_default());
            
            Ok(system_info)
        }).await.context("failed to spawn blocking task")??;
        
        Ok(result)
    }
    
    // 获取客户端唯一标识
    async fn get_client_id() -> Result<String> {
        // 使用 hostname 库获取主机名
        let hostname = tokio::task::spawn_blocking(|| {
            hostname::get()
                .map(|h| h.to_string_lossy().to_string())
                .unwrap_or_default()
        }).await.map_err(|e| anyhow::anyhow!("Failed to get hostname: {}", e))?;
            
        // 简单哈希处理，避免直接发送主机名
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        hostname.hash(&mut hasher);
        let hash = hasher.finish();
        
        let client_id = format!("client-{}", hash);
        info!("生成客户端ID: {}", client_id);
        
        Ok(client_id)
    }
    
    // 获取平台信息
    fn get_platform() -> String {
        #[cfg(target_os = "windows")]
        return "windows".to_string();
        
        #[cfg(target_os = "macos")]
        return "macos".to_string();
        
        #[cfg(target_os = "linux")]
        return "linux".to_string();
        
        #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
        return "unknown".to_string();
    }
    
    // 保存配置到Store
    pub async fn save_config<R: tauri::Runtime>(&self, _app: &tauri::AppHandle<R>) -> Result<()> {
        info!("保存上报配置 (硬编码模式)");
        // 简化实现，不实际保存配置
        info!("配置已保存 (模拟)");
        Ok(())
    }
    
    // 从Store加载配置
    pub async fn load_config<R: tauri::Runtime>(_app: &tauri::AppHandle<R>) -> Result<ReportingConfig> {
        info!("加载上报配置 (硬编码模式)");
        
        // 返回硬编码的默认配置
        let config = ReportingConfig {
            web_service_url: "http://localhost:8000/api/v1/data/report".to_string(),
            auth_token: "test-token-123".to_string(),
            report_interval_minutes: 1, // 默认每分钟上报一次
            data_types: DataTypes {
                frames: true,
                ocr_text: true,
                audio_transcriptions: true,
                ui_monitoring: true,
            },
            last_report_time: None,
            safety_buffer_seconds: 30, // 默认30秒安全缓冲区
            retry: RetryConfig {
                max_attempts: 5,
                initial_backoff_seconds: 30,
                max_backoff_seconds: 3600, // 最大1小时
            },
        };
        
        info!("上报配置加载成功，上报间隔: {}分钟，安全缓冲区: {}秒", 
              config.report_interval_minutes, config.safety_buffer_seconds);
        debug!("加载的配置: {:?}", config);
        
        Ok(config)
    }
} 
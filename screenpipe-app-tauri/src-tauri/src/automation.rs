use serde::{Serialize, Deserialize};
use tauri::AppHandle;
use tracing::{info, error};
use screenpipe_core::operator::{Desktop, Selector, UIElement};
use std::process::Command;
use std::collections::HashSet;
use std::path::Path;

/// 表示UI元素的属性
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UIElementProps {
    pub role: String,
    pub id: Option<String>,
    pub label: Option<String>,
    pub value: Option<String>,
    pub bounds: Option<(f64, f64, f64, f64)>,
    pub children: Option<Vec<UIElementProps>>,
    pub has_children: bool,  // 表示该元素是否有子元素
    pub element_id: Option<String>, // 用于标识元素的唯一ID
}

impl From<UIElement> for UIElementProps {
    fn from(element: UIElement) -> Self {
        let attributes = element.attributes();
        let bounds = element.bounds().ok();
        
        // 检查是否有子元素，但不加载它们
        let has_children = element.children().map(|c| !c.is_empty()).unwrap_or(false);
        
        // 生成唯一ID用于后续懒加载
        let element_id = Some(format!("{:x}", std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos() as u64 % 10000000000));
        
        Self {
            role: element.role(),
            id: element.id(),
            label: attributes.label,
            value: attributes.value,
            bounds,
            children: None,  // 初始不加载子元素
            has_children,
            element_id,
        }
    }
}

/// 元素操作的结果
#[derive(Debug, Serialize, Deserialize)]
pub struct ElementActionResult {
    pub success: bool,
    pub error: Option<String>,
}

/// 选择器定义
#[derive(Debug, Deserialize)]
pub struct SelectorInput {
    pub type_: String,
    pub value: String,
}

/// 脚本信息
#[derive(Debug, Serialize)]
pub struct ScriptInfo {
    pub name: String,
    pub path: String,
    pub created_at: String,
}

/// 脚本模板类型
#[derive(Debug, Deserialize)]
pub enum ScriptTemplateType {
    #[serde(rename = "basic")]
    Basic,
    #[serde(rename = "app_launch")]
    AppLaunch,
    #[serde(rename = "multi_step")]
    MultiStep,
    #[serde(rename = "text_input")]
    TextInput,
}

/// 获取脚本模板
pub fn get_script_template(template_type: ScriptTemplateType) -> String {
    match template_type {
        ScriptTemplateType::Basic => r#"{
  "app": "应用程序名称",
  "selector": {
    "type_": "role",
    "value": "元素角色"
  },
  "action": "click"
}"#.to_string(),

        ScriptTemplateType::AppLaunch => r#"{
  "steps": [
    {
      "name": "启动应用",
      "action": "launch_app",
      "app": "应用程序名称",
      "wait": 2000
    },
    {
      "name": "点击元素",
      "action": "click",
      "app": "应用程序名称",
      "selector": {
        "type_": "role",
        "value": "元素角色"
      }
    }
  ]
}"#.to_string(),

        ScriptTemplateType::MultiStep => r#"{
  "steps": [
    {
      "name": "第一步",
      "action": "click",
      "app": "应用程序名称",
      "selector": {
        "type_": "role",
        "value": "第一个元素角色"
      },
      "wait": 1000
    },
    {
      "name": "第二步",
      "action": "click",
      "app": "应用程序名称",
      "selector": {
        "type_": "role",
        "value": "第二个元素角色"
      }
    }
  ]
}"#.to_string(),

        ScriptTemplateType::TextInput => r#"{
  "steps": [
    {
      "name": "点击输入框",
      "action": "click",
      "app": "应用程序名称",
      "selector": {
        "type_": "role",
        "value": "输入框角色"
      },
      "wait": 500
    },
    {
      "name": "输入文本",
      "action": "input_text",
      "app": "应用程序名称",
      "selector": {
        "type_": "role",
        "value": "输入框角色"
      },
      "text": "要输入的文本"
    }
  ]
}"#.to_string(),
    }
}

/// 获取所有运行的应用程序名称
pub async fn get_applications() -> Result<Vec<String>, String> {
    let desktop = Desktop::new(true, false)
        .map_err(|e| format!("无法初始化桌面自动化: {}", e))?;
        
    let apps = desktop.applications()
        .map_err(|e| format!("无法获取应用程序列表: {}", e))?;
        
    // 使用 HashSet 去除重复项
    let mut app_names_set = HashSet::new();
    
    // 系统应用程序黑名单
    let system_app_patterns = [
        "System", "ControlCenter", "Finder", "WindowServer", 
        "Dock", "Spotlight", "CoreServices", "loginwindow", 
        "universalaccessd", "assistantd", "Notification", "StatusBar",
        "SystemUIServer", "iTerm2 Helper", "Helper", "Agent",
        "daemon", "service", "background", "extension", "plugin",
        "Application Service", "Window Manager", "App Store", 
        "Workspaces", "LaunchPad", "Safari Web Content"
    ];
    
    let app_names: Vec<String> = apps.into_iter()
        .filter_map(|app| {
            let attrs = app.attributes();
            attrs.label
        })
        .filter(|name| {
            // 只添加未见过的应用名称
            app_names_set.insert(name.clone()) && 
            // 过滤系统应用程序
            !system_app_patterns.iter().any(|pattern| name.contains(pattern))
        })
        .collect();
    
    // 按字母顺序排序应用程序名称
    let mut sorted_app_names = app_names;
    sorted_app_names.sort();
        
    Ok(sorted_app_names)
}

/// 获取应用程序的顶层元素，不包含子元素
pub async fn get_app_elements(app_name: String) -> Result<Vec<UIElementProps>, String> {
    info!("获取应用程序 '{}' 的顶层元素", app_name);
    
    let desktop = Desktop::new(true, true)
        .map_err(|e| format!("无法初始化桌面自动化: {}", e))?;
        
    let app = desktop.application(&app_name)
        .map_err(|e| format!("无法找到应用程序 '{}': {}", app_name, e))?;
        
    let children = app.children()
        .map_err(|e| format!("无法获取应用程序元素: {}", e))?;
    
    info!("找到 {} 个顶层元素", children.len());
        
    let element_props = children.into_iter()
        .map(|element| element.into())
        .collect();
        
    Ok(element_props)
}

/// 根据应用名称和元素选择器，获取特定元素的子元素
pub async fn get_element_children(
    app_name: String, 
    selector_type: String,
    selector_value: String
) -> Result<Vec<UIElementProps>, String> {
    info!("获取应用程序 '{}' 中元素的子元素，选择器类型: {}, 值: {}", 
          app_name, selector_type, selector_value);
    
    // 初始化桌面自动化
    let desktop = Desktop::new(true, true)
        .map_err(|e| {
            error!("无法初始化桌面自动化: {}", e);
            format!("无法初始化桌面自动化: {}", e)
        })?;
        
    // 获取应用
    let app = desktop.application(&app_name)
        .map_err(|e| {
            error!("无法找到应用程序 '{}': {}", app_name, e);
            format!("无法找到应用程序 '{}': {}", app_name, e)
        })?;
    
    // 创建选择器
    let sel = match selector_type.as_str() {
        "role" => {
            info!("使用角色选择器: {}", selector_value);
            Selector::Role { 
                role: selector_value.clone(), 
                name: None 
            }
        },
        "id" => {
            info!("使用ID选择器: {}", selector_value);
            Selector::Id(selector_value.clone())
        },
        "name" => {
            info!("使用名称选择器: {}", selector_value);
            Selector::Name(selector_value.clone())
        },
        "text" => {
            info!("使用文本选择器: {}", selector_value);
            Selector::Text(selector_value.clone())
        },
        "element_id" => {
            // 使用element_id查找元素
            // 由于element_id是我们自己生成的，需要遍历所有元素来查找
            info!("使用element_id选择器: {}", selector_value);
            
            // 获取所有顶层元素
            let top_elements = app.children()
                .map_err(|e| {
                    error!("无法获取应用程序元素: {}", e);
                    format!("无法获取应用程序元素: {}", e)
                })?;
            
            info!("找到 {} 个顶层元素，开始递归查找", top_elements.len());
                
            // 递归查找具有指定element_id的元素
            let mut found_element = None;
            for element in top_elements {
                if let Some(found) = find_element_by_id(&element, &selector_value) {
                    found_element = Some(found);
                    info!("找到匹配的元素，element_id: {}", selector_value);
                    break;
                }
            }
            
            // 如果找到了元素，直接返回其子元素
            if let Some(element) = found_element {
                let children = element.children()
                    .map_err(|e| {
                        error!("无法获取子元素: {}", e);
                        format!("无法获取子元素: {}", e)
                    })?;
                
                info!("找到 {} 个子元素", children.len());
                
                let child_props = children.into_iter()
                    .map(|element| element.into())
                    .collect();
                
                return Ok(child_props);
            } else {
                error!("未找到element_id为{}的元素", selector_value);
                return Err(format!("未找到element_id为{}的元素", selector_value));
            }
        },
        "combined" => {
            // 解析组合选择器
            info!("使用组合选择器: {}", selector_value);
            let combined: serde_json::Value = serde_json::from_str(&selector_value)
                .map_err(|e| {
                    error!("无法解析组合选择器: {}", e);
                    format!("无法解析组合选择器: {}", e)
                })?;
            
            let role = combined.get("role")
                .and_then(|v| v.as_str())
                .ok_or_else(|| {
                    let err = "组合选择器缺少role字段".to_string();
                    error!("{}", err);
                    err
                })?;
                
            let label = combined.get("label")
                .and_then(|v| v.as_str());
            
            info!("组合选择器解析为 role: {}, label: {:?}", role, label);
                
            Selector::Role { 
                role: role.to_string(), 
                name: label.map(|s| s.to_string()) 
            }
        },
        _ => {
            let err = format!("不支持的选择器类型: {}", selector_type);
            error!("{}", err);
            return Err(err);
        },
    };
    
    // 如果是element_id选择器，前面已经处理过了
    if selector_type == "element_id" {
        return Err("未找到匹配的元素".to_string());
    }
    
    // 查找指定元素
    let locator = app.locator(sel)
        .map_err(|e| {
            error!("无法创建定位器: {}", e);
            format!("无法创建定位器: {}", e)
        })?;
    
    let parent_element = locator.first()
        .map_err(|e| {
            error!("无法找到元素: {}", e);
            format!("无法找到元素: {}", e)
        })?
        .ok_or_else(|| {
            let err = "未找到匹配的元素".to_string();
            error!("{}", err);
            err
        })?;
    
    // 获取该元素的子元素
    let children = parent_element.children()
        .map_err(|e| {
            error!("无法获取子元素: {}", e);
            format!("无法获取子元素: {}", e)
        })?;
    
    info!("找到 {} 个子元素", children.len());
    
    // 转换为前端格式
    let child_props = children.into_iter()
        .map(|element| element.into())
        .collect();
    
    Ok(child_props)
}

/// 递归查找具有指定element_id的元素
fn find_element_by_id(element: &UIElement, target_id: &str) -> Option<UIElement> {
    // 检查当前元素
    let element_props: UIElementProps = element.clone().into();
    if let Some(id) = element_props.element_id {
        if id == target_id {
            return Some(element.clone());
        }
    }
    
    // 检查子元素
    if let Ok(children) = element.children() {
        for child in children {
            if let Some(found) = find_element_by_id(&child, target_id) {
                return Some(found);
            }
        }
    }
    
    None
}

/// 对元素执行操作
pub async fn perform_element_action(
    app_name: String, 
    selector: SelectorInput, 
    action: String,
    text: Option<String>
) -> Result<ElementActionResult, String> {
    let desktop = Desktop::new(true, true)
        .map_err(|e| format!("无法初始化桌面自动化: {}", e))?;
        
    let app = desktop.application(&app_name)
        .map_err(|e| format!("无法找到应用程序 '{}': {}", app_name, e))?;
    
    // 键盘按键操作，不需要选择元素
    if action == "key_press" {
        #[cfg(target_os = "macos")]
        {
            // 获取要按的键，默认为回车键
            let key = text.unwrap_or_else(|| "return".to_string());
            
            // 使用osascript模拟按键
            let script = format!(r#"
                tell application "System Events"
                    keystroke "{}"
                end tell
            "#, key);
            
            let output = Command::new("osascript")
                .arg("-e")
                .arg(script)
                .output()
                .map_err(|e| format!("执行AppleScript失败: {}", e))?;
                
            if output.status.success() {
                return Ok(ElementActionResult {
                    success: true,
                    error: None,
                });
            } else {
                let error = String::from_utf8_lossy(&output.stderr);
                return Ok(ElementActionResult {
                    success: false,
                    error: Some(format!("按键操作失败: {}", error)),
                });
            }
        }
        
        #[cfg(not(target_os = "macos"))]
        {
            return Err("目前仅支持macOS上的键盘操作".to_string());
        }
    }
    
    // 创建选择器
    let sel = match selector.type_.as_str() {
        "role" => Selector::Role { 
            role: selector.value.clone(), 
            name: None 
        },
        "id" => Selector::Id(selector.value.clone()),
        "name" => Selector::Name(selector.value.clone()),
        "text" => Selector::Text(selector.value.clone()),
        _ => return Err(format!("不支持的选择器类型: {}", selector.type_)),
    };
    
    // 查找元素
    let locator = app.locator(sel)
        .map_err(|e| format!("无法创建定位器: {}", e))?;
    
    let element = locator.first()
        .map_err(|e| format!("无法找到元素: {}", e))?
        .ok_or_else(|| "未找到匹配的元素".to_string())?;
    
    // 执行操作
    let result = match action.as_str() {
        "click" => element.click().map_err(|e| format!("{}", e)),
        "hover" => element.hover().map_err(|e| format!("{}", e)),
        "focus" => element.focus().map_err(|e| format!("{}", e)),
        "get_text" => {
            let text = element.text(5)
                .map_err(|e| format!("获取文本失败: {}", e))?;
            println!("获取到文本: {}", text);
            Ok(())
        },
        "double_click" => element.double_click().map_err(|e| format!("{}", e)),
        "right_click" => element.right_click().map_err(|e| format!("{}", e)),
        "input_text" => {
            // 首先点击元素以获取焦点
            element.click().map_err(|e| format!("点击元素失败: {}", e))?;
            
            // 然后使用AppleScript输入文本
            #[cfg(target_os = "macos")]
            {
                // 从参数中获取要输入的文本
                let input_text = text.ok_or_else(|| "未提供要输入的文本".to_string())?;
                
                // 使用osascript输入文本
                let script = format!(r#"
                    tell application "System Events"
                        keystroke "{}"
                    end tell
                "#, input_text);
                
                let output = Command::new("osascript")
                    .arg("-e")
                    .arg(script)
                    .output()
                    .map_err(|e| format!("执行AppleScript失败: {}", e))?;
                    
                if output.status.success() {
                    Ok(())
                } else {
                    let error = String::from_utf8_lossy(&output.stderr);
                    Err(format!("文本输入失败: {}", error))
                }
            }
            
            #[cfg(not(target_os = "macos"))]
            {
                Err("目前仅支持macOS上的文本输入".to_string())
            }
        },
        "custom" => {
            // 自定义操作可以在这里扩展
            Ok(())
        },
        _ => return Err(format!("不支持的操作: {}", action)),
    };
    
    match result {
        Ok(_) => Ok(ElementActionResult {
            success: true,
            error: None,
        }),
        Err(e) => Ok(ElementActionResult {
            success: false,
            error: Some(e),
        }),
    }
}

/// 列出所有已保存的自动化脚本
pub async fn list_automation_scripts(app: &AppHandle) -> Result<Vec<ScriptInfo>, String> {
    // 获取脚本目录
    let base_dir = crate::get_base_dir(app, None)
        .map_err(|e| format!("无法获取应用数据目录: {}", e))?;
    
    let scripts_dir = base_dir.join("automation_scripts");
    if !scripts_dir.exists() {
        return Ok(vec![]);
    }
    
    // 读取目录中的所有文件
    let entries = std::fs::read_dir(&scripts_dir)
        .map_err(|e| format!("无法读取脚本目录: {}", e))?;
    
    let mut scripts = Vec::new();
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("无法读取目录条目: {}", e))?;
        let path = entry.path();
        
        if path.is_file() && path.extension().map_or(false, |ext| ext == "json") {
            let file_name = path.file_name().unwrap().to_string_lossy().to_string();
            
            // 从文件名中提取时间戳
            let created_at = if file_name.starts_with("script_") && file_name.ends_with(".json") {
                let timestamp = &file_name[7..file_name.len()-5]; // 删除 "script_" 和 ".json"
                
                // 尝试将时间戳格式化为更友好的日期时间
                if timestamp.len() >= 15 {
                    format!("{}-{}-{} {}:{}:{}",
                        &timestamp[0..4], &timestamp[4..6], &timestamp[6..8],
                        &timestamp[9..11], &timestamp[11..13], &timestamp[13..15]
                    )
                } else {
                    timestamp.to_string()
                }
            } else {
                "未知时间".to_string()
            };
            
            scripts.push(ScriptInfo {
                name: file_name,
                path: path.to_string_lossy().to_string(),
                created_at,
            });
        }
    }
    
    // 按创建时间倒序排序（最新的在前面）
    scripts.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    
    Ok(scripts)
}

/// 加载自动化脚本内容
pub async fn load_automation_script(path: String) -> Result<String, String> {
    // 读取脚本文件内容
    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("无法读取脚本文件: {}", e))?;
    
    Ok(content)
}

/// 保存自动化脚本
pub async fn save_automation_script(app: &AppHandle, script: String) -> Result<(), String> {
    // 获取脚本保存目录
    let base_dir = crate::get_base_dir(app, None)
        .map_err(|e| format!("无法获取应用数据目录: {}", e))?;
    
    let scripts_dir = base_dir.join("automation_scripts");
    if !scripts_dir.exists() {
        std::fs::create_dir_all(&scripts_dir)
            .map_err(|e| format!("无法创建脚本目录: {}", e))?;
    }
    
    // 使用时间戳创建唯一文件名
    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
    let file_path = scripts_dir.join(format!("script_{}.json", timestamp));
    
    // 写入脚本文件
    std::fs::write(&file_path, script)
        .map_err(|e| format!("无法保存脚本文件: {}", e))?;
    
    println!("脚本已保存到: {:?}", file_path);
    Ok(())
}

/// 启动应用程序
pub async fn launch_application(app_name: &str) -> Result<(), String> {
    info!("尝试启动应用程序: {}", app_name);
    
    // 检查应用程序是否已经在运行
    let desktop = Desktop::new(true, false)
        .map_err(|e| format!("无法初始化桌面自动化: {}", e))?;
        
    let apps = desktop.applications()
        .map_err(|e| format!("无法获取应用程序列表: {}", e))?;
        
    let app_running = apps.into_iter()
        .filter_map(|app| app.attributes().label)
        .any(|name| name == app_name);
        
    if app_running {
        info!("应用程序 '{}' 已经在运行", app_name);
        return Ok(());
    }
    
    // 应用程序未运行，尝试启动它
    #[cfg(target_os = "macos")]
    {
        // 首先尝试直接使用应用名称启动
        let mut cmd = Command::new("open");
        cmd.arg("-a").arg(app_name);
        
        match cmd.output() {
            Ok(output) => {
                if output.status.success() {
                    info!("成功启动应用程序: {}", app_name);
                    
                    // 等待应用程序启动完成 (2秒)
                    tokio::time::sleep(tokio::time::Duration::from_millis(2000)).await;
                    return Ok(());
                } else {
                    let error = String::from_utf8_lossy(&output.stderr);
                    info!("启动失败，尝试搜索应用程序: {}", error);
                }
            }
            Err(e) => {
                info!("执行启动命令失败: {}", e);
            }
        }
        
        // 如果直接启动失败，尝试在系统应用目录中查找
        let app_paths = [
            "/Applications",
            "/System/Applications",
            "/System/Library/CoreServices"
        ];
        
        for &path in &app_paths {
            // 查找完全匹配的应用程序名称
            let exact_app_name = format!("{}/{}.app", path, app_name);
            
            if Path::new(&exact_app_name).exists() {
                let mut cmd = Command::new("open");
                cmd.arg(exact_app_name);
                
                match cmd.output() {
                    Ok(output) => {
                        if output.status.success() {
                            info!("成功从 {} 启动应用程序", path);
                            
                            // 等待应用程序启动完成
                            tokio::time::sleep(tokio::time::Duration::from_millis(2000)).await;
                            return Ok(());
                        }
                    }
                    Err(e) => {
                        info!("启动命令执行失败: {}", e);
                    }
                }
            }
            
            // 尝试通过搜索查找应用程序
            let search_pattern = format!("{}/{}.app", path, app_name.replace(" ", "*."));
            
            match glob::glob(&search_pattern) {
                Ok(entries) => {
                    for entry in entries {
                        if let Ok(path) = entry {
                            let app_path = path.to_string_lossy();
                            info!("找到可能的应用程序路径: {}", app_path);
                            
                            let mut cmd = Command::new("open");
                            cmd.arg(app_path.to_string());
                            
                            match cmd.output() {
                                Ok(output) => {
                                    if output.status.success() {
                                        info!("成功通过搜索启动应用程序");
                                        
                                        // 等待应用程序启动完成
                                        tokio::time::sleep(tokio::time::Duration::from_millis(2000)).await;
                                        return Ok(());
                                    }
                                }
                                Err(e) => {
                                    info!("启动命令执行失败: {}", e);
                                }
                            }
                        }
                    }
                }
                Err(e) => {
                    info!("文件搜索失败: {}", e);
                }
            }
        }
        
        return Err(format!("无法找到或启动应用程序: {}", app_name));
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        return Err("目前仅支持macOS上的应用程序启动".to_string());
    }
}

/// 执行多步骤脚本
pub async fn run_multi_step_script(steps: &[serde_json::Value]) -> Result<ElementActionResult, String> {
    // 用于存储最终结果
    let mut final_result = ElementActionResult {
        success: true,
        error: None,
    };
    
    // 逐个执行每个步骤
    for (index, step) in steps.iter().enumerate() {
        println!("执行步骤 {}/{}: {}", index + 1, steps.len(), 
                 step["name"].as_str().unwrap_or(&format!("步骤{}", index + 1)));
        
        // 获取操作类型
        let action = step["action"]
            .as_str()
            .unwrap_or("click")
            .to_string();
            
        // 处理启动应用程序操作
        if action == "launch_app" {
            let app_name = step["app"]
                .as_str()
                .ok_or_else(|| format!("步骤 {} 中缺少应用程序名称", index + 1))?;
                
            match launch_application(app_name).await {
                Ok(_) => {
                    info!("成功启动应用程序: {}", app_name);
                }
                Err(e) => {
                    final_result.success = false;
                    final_result.error = Some(format!("步骤 {} 启动应用程序失败: {}", index + 1, e));
                    return Ok(final_result);
                }
            }
        } else {
            // 常规元素操作
            // 提取步骤信息
            let app_name = step["app"]
                .as_str()
                .ok_or_else(|| format!("步骤 {} 中缺少应用程序名称", index + 1))?
                .to_string();
            
            let selector_type = step["selector"]["type_"]
                .as_str()
                .ok_or_else(|| format!("步骤 {} 中缺少选择器类型", index + 1))?
                .to_string();
            
            let selector_value = step["selector"]["value"]
                .as_str()
                .ok_or_else(|| format!("步骤 {} 中缺少选择器值", index + 1))?
                .to_string();
            
            // 创建选择器
            let selector = SelectorInput {
                type_: selector_type,
                value: selector_value,
            };
            
            // 获取可选的文本参数(用于input_text和key_press操作)
            let input_text = if action == "input_text" || action == "key_press" {
                step["text"].as_str().map(|s| s.to_string())
            } else {
                None
            };
            
            // 执行元素操作
            let result = perform_element_action(app_name, selector, action, input_text).await?;
            
            // 如果步骤执行失败，记录错误并终止执行
            if !result.success {
                final_result.success = false;
                final_result.error = Some(format!("步骤 {} 执行失败: {}", 
                                                index + 1, 
                                                result.error.unwrap_or_else(|| "未知错误".to_string())));
                return Ok(final_result);
            }
        }
        
        // 检查是否需要等待
        if let Some(wait_time) = step["wait"].as_u64() {
            println!("等待 {} 毫秒", wait_time);
            tokio::time::sleep(tokio::time::Duration::from_millis(wait_time)).await;
        }
    }
    
    // 所有步骤都成功执行
    Ok(final_result)
}

/// 运行自动化脚本
pub async fn run_automation_script(script: String) -> Result<ElementActionResult, String> {
    // 解析脚本内容
    let script_data: serde_json::Value = serde_json::from_str(&script)
        .map_err(|e| format!("无法解析脚本内容: {}", e))?;
    
    // 检查是否是多步骤脚本
    if let Some(steps) = script_data["steps"].as_array() {
        return run_multi_step_script(steps).await;
    }
    
    // 单步骤脚本的处理逻辑保持不变
    // 提取应用程序名称
    let app_name = script_data["app"]
        .as_str()
        .ok_or_else(|| "脚本中缺少应用程序名称".to_string())?
        .to_string();
    
    // 提取选择器信息
    let selector_type = script_data["selector"]["type_"]
        .as_str()
        .ok_or_else(|| "脚本中缺少选择器类型".to_string())?
        .to_string();
    
    let selector_value = script_data["selector"]["value"]
        .as_str()
        .ok_or_else(|| "脚本中缺少选择器值".to_string())?
        .to_string();
    
    // 提取操作（默认为点击）
    let action = script_data["action"]
        .as_str()
        .unwrap_or("click")
        .to_string();
    
    // 创建选择器
    let selector = SelectorInput {
        type_: selector_type,
        value: selector_value,
    };
    
    // 执行元素操作
    perform_element_action(app_name, selector, action, None).await
}

/// 删除自动化脚本
pub async fn delete_automation_script(path: &str) -> Result<(), String> {
    // 检查文件是否存在
    if !Path::new(path).exists() {
        return Err(format!("脚本文件不存在: {}", path));
    }
    
    // 删除文件
    tokio::fs::remove_file(path)
        .await
        .map_err(|e| format!("无法删除脚本文件: {}", e))?;
    
    info!("脚本已删除: {}", path);
    Ok(())
}

/// 编辑并保存自动化脚本
pub async fn update_automation_script(path: &str, new_content: String) -> Result<(), String> {
    // 检查文件是否存在
    if !Path::new(path).exists() {
        return Err(format!("脚本文件不存在: {}", path));
    }
    
    // 验证新内容是有效的JSON
    match serde_json::from_str::<serde_json::Value>(&new_content) {
        Ok(_) => {
            // 写入新内容到文件
            tokio::fs::write(path, new_content)
                .await
                .map_err(|e| format!("无法保存修改后的脚本: {}", e))?;
            
            info!("脚本已更新: {}", path);
            Ok(())
        },
        Err(e) => Err(format!("无效的脚本内容，不是有效的JSON: {}", e)),
    }
}

/// 获取脚本预览信息
pub async fn get_script_preview(path: &str) -> Result<ScriptPreview, String> {
    // 读取脚本文件内容
    let content = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| format!("无法读取脚本文件: {}", e))?;
    
    // 解析脚本内容
    let script_data: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("无法解析脚本内容: {}", e))?;
    
    // 提取预览信息
    let is_multi_step = script_data["steps"].is_array();
    let step_count = if is_multi_step {
        script_data["steps"].as_array().map_or(0, |steps| steps.len())
    } else {
        1
    };
    
    let target_app = if is_multi_step {
        script_data["steps"][0]["app"].as_str().unwrap_or("未知应用").to_string()
    } else {
        script_data["app"].as_str().unwrap_or("未知应用").to_string()
    };
    
    // 提取脚本名称（从文件路径中提取）
    let script_name = Path::new(path)
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("未知脚本")
        .to_string();
    
    Ok(ScriptPreview {
        name: script_name,
        path: path.to_string(),
        target_app,
        step_count,
        is_multi_step,
    })
}

/// 脚本预览信息
#[derive(Debug, Serialize)]
pub struct ScriptPreview {
    pub name: String,
    pub path: String,
    pub target_app: String,
    pub step_count: usize,
    pub is_multi_step: bool,
}

/// 基于模板创建新脚本
pub async fn create_script_from_template(
    app: &AppHandle,
    template_type: ScriptTemplateType
) -> Result<String, String> {
    // 获取模板内容
    let template_content = get_script_template(template_type);
    
    // 保存脚本
    save_automation_script(app, template_content.clone()).await?;
    
    // 返回新创建的脚本内容
    Ok(template_content)
}
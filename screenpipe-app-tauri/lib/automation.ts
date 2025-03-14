import { pipe as browserPipe, ElementInfo } from "@screenpipe/browser";
import { join, appDataDir } from "@tauri-apps/api/path";
import { create as createDir, exists, readDir, readTextFile, writeTextFile, remove as removeFile } from "@tauri-apps/plugin-fs";
import { Command } from "@tauri-apps/plugin-shell";

// 表示UI元素的属性
export interface UIElementProps {
  role: string;
  id?: string;
  label?: string;
  value?: string;
  bounds?: [number, number, number, number];
  children?: UIElementProps[];
  has_children: boolean;
  element_id?: string;
}

// 元素操作的结果
export interface ElementActionResult {
  success: boolean;
  error?: string;
}

// 选择器定义
export interface SelectorInput {
  type_: string;
  value: string;
}

// 脚本信息
export interface ScriptInfo {
  name: string;
  path: string;
  created_at: string;
}

// 脚本预览信息
export interface ScriptPreview {
  name: string;
  path: string;
  target_app: string;
  step_count: number;
  is_multi_step: boolean;
}

// 脚本模板类型
export enum ScriptTemplateType {
  Basic = "basic",
  AppLaunch = "app_launch",
  MultiStep = "multi_step",
  TextInput = "text_input"
}

// 获取脚本模板
export function getScriptTemplate(templateType: ScriptTemplateType): string {
  switch (templateType) {
    case ScriptTemplateType.Basic:
      return `{
  "app": "应用程序名称",
  "selector": {
    "type_": "role",
    "value": "元素角色"
  },
  "action": "click"
}`;

    case ScriptTemplateType.AppLaunch:
      return `{
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
}`;

    case ScriptTemplateType.MultiStep:
      return `{
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
}`;

    case ScriptTemplateType.TextInput:
      return `{
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
}`;
  }
}

// 将ElementInfo转换为UIElementProps
function convertElementInfoToProps(element: ElementInfo): UIElementProps {
  // 生成唯一ID用于后续懒加载
  const elementId = `${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 10)}`;
  
  return {
    role: element.role,
    id: element.id,
    label: element.label,
    value: element.text,
    bounds: element.position && element.size ? [
      element.position.x, 
      element.position.y, 
      element.size.width, 
      element.size.height
    ] : undefined,
    children: undefined,  // 初始不加载子元素
    has_children: true,   // 假设所有元素可能有子元素
    element_id: elementId,
  };
}

// 获取脚本目录
async function getScriptsDir(): Promise<string> {
  const appData = await appDataDir();
  return join(appData, "automation_scripts");
}

// 获取所有运行的应用程序名称
export async function getApplications(): Promise<string[]> {
  try {
    // 在macOS上使用系统命令获取运行中的应用程序
    if (process.platform === "darwin") {
      // 使用 Tauri 的 Command API
      const command = await Command.create("osascript", ["-e", 'tell application "System Events" to get name of (processes where background only is false)']);
      const output = await command.execute();
      const apps = output.stdout.split(", ").map((app: string) => app.trim());
      
      // 系统应用程序黑名单
      const systemAppPatterns = [
        "System", "ControlCenter", "Finder", "WindowServer", 
        "Dock", "Spotlight", "CoreServices", "loginwindow", 
        "universalaccessd", "assistantd", "Notification", "StatusBar",
        "SystemUIServer", "iTerm2 Helper", "Helper", "Agent",
        "daemon", "service", "background", "extension", "plugin",
        "Application Service", "Window Manager", "App Store", 
        "Workspaces", "LaunchPad", "Safari Web Content"
      ];
      
      // 过滤并排序应用程序名称
      const filteredApps = apps
        .filter((appName: string) => !systemAppPatterns.some(pattern => appName.includes(pattern)))
        .sort();
      
      return filteredApps;
    } else {
      throw new Error("目前仅支持macOS获取应用程序列表");
    }
  } catch (error) {
    console.error("无法获取应用程序列表:", error);
    throw new Error(`无法获取应用程序列表: ${error}`);
  }
}

// 获取应用程序的顶层元素
export async function getAppElements(appName: string): Promise<UIElementProps[]> {
  try {
    console.log(`获取应用程序 '${appName}' 的顶层元素`);
    
    // 使用browserPipe获取应用程序的顶层元素
    const elements = await browserPipe.operator
      .locator({
        app: appName,
        useBackgroundApps: true,
        activateApp: true
      })
      .all();
    
    console.log(`找到 ${elements.length} 个顶层元素`);
    
    // 转换为UIElementProps格式
    return elements.map(convertElementInfoToProps);
  } catch (error) {
    console.error(`无法获取应用程序 '${appName}' 的元素:`, error);
    throw new Error(`无法获取应用程序元素: ${error}`);
  }
}

// 根据应用名称和元素选择器，获取特定元素的子元素
export async function getElementChildren(
  appName: string,
  selectorType: string,
  selectorValue: string
): Promise<UIElementProps[]> {
  try {
    console.log(`获取应用程序 '${appName}' 中元素的子元素，选择器类型: ${selectorType}, 值: ${selectorValue}`);
    
    let elements: ElementInfo[] = [];
    
    // 根据选择器类型创建不同的定位器
    switch (selectorType) {
      case "role":
        elements = await browserPipe.operator
          .locator({
            app: appName,
            role: selectorValue,
            useBackgroundApps: true,
            activateApp: true
          })
          .all();
        break;
        
      case "id":
        elements = await browserPipe.operator
          .locator({
            app: appName,
            id: selectorValue,
            useBackgroundApps: true,
            activateApp: true
          })
          .all();
        break;
        
      case "name":
      case "text":
        elements = await browserPipe.operator
          .locator({
            app: appName,
            text: selectorValue,
            useBackgroundApps: true,
            activateApp: true
          })
          .all();
        break;
        
      case "combined":
        // 解析组合选择器
        const combined = JSON.parse(selectorValue);
        elements = await browserPipe.operator
          .locator({
            app: appName,
            role: combined.role,
            label: combined.label,
            useBackgroundApps: true,
            activateApp: true
          })
          .all();
        break;
        
      default:
        throw new Error(`不支持的选择器类型: ${selectorType}`);
    }
    
    if (elements.length === 0) {
      throw new Error("未找到匹配的元素");
    }
    
    // 获取第一个匹配元素的子元素
    // 注意：@screenpipe/browser 目前不直接支持获取子元素
    // 这里我们使用一个变通方法，通过增加搜索深度来获取可能的子元素
    const childElements = await browserPipe.operator
      .locator({
        app: appName,
        useBackgroundApps: true,
        activateApp: true
      })
      .all(20, 2); // 增加搜索深度和结果数量
    
    // 过滤可能的子元素（这是一个简化的方法，实际情况可能需要更复杂的逻辑）
    const parentElement = elements[0];
    const possibleChildren = childElements.filter(child => {
      // 检查位置是否在父元素内部
      if (parentElement.position && parentElement.size && child.position) {
        return (
          child.position.x >= parentElement.position.x &&
          child.position.y >= parentElement.position.y &&
          child.position.x < parentElement.position.x + parentElement.size.width &&
          child.position.y < parentElement.position.y + parentElement.size.height
        );
      }
      return false;
    });
    
    console.log(`找到 ${possibleChildren.length} 个可能的子元素`);
    
    // 转换为UIElementProps格式
    return possibleChildren.map(convertElementInfoToProps);
  } catch (error) {
    console.error(`无法获取子元素:`, error);
    throw new Error(`无法获取子元素: ${error}`);
  }
}

// 对元素执行操作
export async function performElementAction(
  appName: string,
  selector: SelectorInput,
  action: string,
  text?: string
): Promise<ElementActionResult> {
  try {
    // 键盘按键操作，不需要选择元素
    if (action === "key_press") {
      if (process.platform === "darwin") {
        // 获取要按的键，默认为回车键
        const key = text || "return";
        
        // 使用browserPipe的键盘操作
        await browserPipe.input.press(key);
        
        return {
          success: true
        };
      } else {
        throw new Error("目前仅支持macOS上的键盘操作");
      }
    }
    
    // 创建定位器选项
    const locatorOptions: any = {
      app: appName,
      useBackgroundApps: true,
      activateApp: true
    };
    
    // 根据选择器类型设置不同的定位参数
    switch (selector.type_) {
      case "role":
        locatorOptions.role = selector.value;
        break;
      case "id":
        locatorOptions.id = selector.value;
        break;
      case "name":
      case "text":
        locatorOptions.text = selector.value;
        break;
      default:
        throw new Error(`不支持的选择器类型: ${selector.type_}`);
    }
    
    // 执行操作
    switch (action) {
      case "click":
        // 使用locator的click方法
        await browserPipe.operator.locator(locatorOptions).click();
        break;
        
      case "hover":
        // 目前API不支持hover，使用click代替
        console.warn("hover操作不直接支持，使用click代替");
        await browserPipe.operator.locator(locatorOptions).click();
        break;
        
      case "focus":
        // 通过点击来获取焦点
        await browserPipe.operator.locator(locatorOptions).click();
        break;
        
      case "get_text":
        // 获取元素文本
        const element = await browserPipe.operator.locator(locatorOptions).first();
        if (element) {
          console.log("获取到文本:", element.text);
        }
        break;
        
      case "double_click":
        // 目前API不支持双击，使用两次click模拟
        console.warn("双击操作不直接支持，使用两次click模拟");
        await browserPipe.operator.locator(locatorOptions).click();
        await new Promise(resolve => setTimeout(resolve, 100));
        await browserPipe.operator.locator(locatorOptions).click();
        break;
        
      case "right_click":
        // 使用input.click方法模拟右键点击
        // 先定位元素
        const targetElement = await browserPipe.operator.locator(locatorOptions).first();
        if (targetElement && targetElement.position) {
          // 移动鼠标到元素位置
          await browserPipe.input.moveMouse(
            targetElement.position.x + (targetElement.size?.width || 0) / 2,
            targetElement.position.y + (targetElement.size?.height || 0) / 2
          );
          // 执行右键点击
          await browserPipe.input.click("right");
        } else {
          throw new Error("无法获取元素位置进行右键点击");
        }
        break;
        
      case "input_text":
        // 首先点击元素以获取焦点
        await browserPipe.operator.locator(locatorOptions).click();
        
        // 然后输入文本
        if (text) {
          // 使用input.type方法输入文本
          await browserPipe.input.type(text);
        } else {
          return {
            success: false,
            error: "未提供要输入的文本"
          };
        }
        break;
        
      default:
        return {
          success: false,
          error: `不支持的操作: ${action}`
        };
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error(`执行操作失败:`, error);
    return {
      success: false,
      error: `执行操作失败: ${error}`
    };
  }
}

// 列出所有已保存的自动化脚本
export async function listAutomationScripts(): Promise<ScriptInfo[]> {
  try {
    // 获取脚本目录
    const scriptsDir = await getScriptsDir();
    
    // 检查目录是否存在
    const dirExists = await exists(scriptsDir);
    if (!dirExists) {
      return [];
    }
    
    // 读取目录中的所有文件
    const entries = await readDir(scriptsDir);
    
    const scripts: ScriptInfo[] = [];
    
    for (const entry of entries) {
      if (entry.name?.endsWith(".json")) {
        const filePath = await join(scriptsDir, entry.name);
        
        // 从文件名中提取时间戳
        let createdAt = "未知时间";
        
        if (entry.name.startsWith("script_") && entry.name.endsWith(".json")) {
          const timestamp = entry.name.substring(7, entry.name.length - 5);
          
          // 尝试将时间戳格式化为更友好的日期时间
          if (timestamp.length >= 15) {
            createdAt = `${timestamp.substring(0, 4)}-${timestamp.substring(4, 6)}-${timestamp.substring(6, 8)} ${timestamp.substring(9, 11)}:${timestamp.substring(11, 13)}:${timestamp.substring(13, 15)}`;
          } else {
            createdAt = timestamp;
          }
        }
        
        scripts.push({
          name: entry.name,
          path: filePath,
          created_at: createdAt
        });
      }
    }
    
    // 按创建时间倒序排序（最新的在前面）
    scripts.sort((a, b) => b.created_at.localeCompare(a.created_at));
    
    return scripts;
  } catch (error) {
    console.error("无法列出自动化脚本:", error);
    throw new Error(`无法列出自动化脚本: ${error}`);
  }
}

// 加载自动化脚本内容
export async function loadAutomationScript(path: string): Promise<string> {
  try {
    // 使用 Tauri 的 readTextFile API
    const content = await readTextFile(path);
    return content;
  } catch (error) {
    console.error("无法读取脚本文件:", error);
    throw new Error(`无法读取脚本文件: ${error}`);
  }
}

// 保存自动化脚本
export async function saveAutomationScript(script: string): Promise<void> {
  try {
    // 获取脚本保存目录
    const scriptsDir = await getScriptsDir();
    
    // 确保目录存在
    const dirExists = await exists(scriptsDir);
    if (!dirExists) {
      await createDir(scriptsDir);
    }
    
    // 使用时间戳创建唯一文件名
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const filePath = await join(scriptsDir, `script_${timestamp}.json`);
    
    // 使用 Tauri 的 writeTextFile API
    await writeTextFile(filePath, script);
    
    console.log("脚本已保存到:", filePath);
  } catch (error) {
    console.error("无法保存自动化脚本:", error);
    throw new Error(`无法保存自动化脚本: ${error}`);
  }
}

// 启动应用程序
export async function launchApplication(appName: string): Promise<void> {
  try {
    console.log("尝试启动应用程序:", appName);
    
    // 检查应用程序是否已经在运行
    const apps = await getApplications();
    const appRunning = apps.includes(appName);
    
    if (appRunning) {
      console.log(`应用程序 '${appName}' 已经在运行`);
      return;
    }
    
    // 应用程序未运行，尝试启动它
    if (process.platform === "darwin") {
      // 使用 Tauri 的 Command API
      const command = await Command.create("open", ["-a", appName]);
      await command.execute();
      
      // 等待应用程序启动完成 (2秒)
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      throw new Error("目前仅支持macOS上的应用程序启动");
    }
  } catch (error) {
    console.error("无法启动应用程序:", error);
    throw new Error(`无法启动应用程序 ${appName}: ${error}`);
  }
}

// 执行多步骤脚本
export async function runMultiStepScript(steps: any[]): Promise<ElementActionResult> {
  // 用于存储最终结果
  const finalResult: ElementActionResult = {
    success: true
  };
  
  // 逐个执行每个步骤
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`执行步骤 ${i + 1}/${steps.length}: ${step.name || `步骤${i + 1}`}`);
    
    // 获取操作类型
    const action = step.action || "click";
    
    // 处理启动应用程序操作
    if (action === "launch_app") {
      const appName = step.app;
      if (!appName) {
        finalResult.success = false;
        finalResult.error = `步骤 ${i + 1} 中缺少应用程序名称`;
        return finalResult;
      }
      
      try {
        await launchApplication(appName);
        console.log(`成功启动应用程序: ${appName}`);
      } catch (error) {
        finalResult.success = false;
        finalResult.error = `步骤 ${i + 1} 启动应用程序失败: ${error}`;
        return finalResult;
      }
    } else {
      // 常规元素操作
      // 提取步骤信息
      const appName = step.app;
      if (!appName) {
        finalResult.success = false;
        finalResult.error = `步骤 ${i + 1} 中缺少应用程序名称`;
        return finalResult;
      }
      
      const selectorType = step.selector?.type_;
      if (!selectorType) {
        finalResult.success = false;
        finalResult.error = `步骤 ${i + 1} 中缺少选择器类型`;
        return finalResult;
      }
      
      const selectorValue = step.selector?.value;
      if (!selectorValue) {
        finalResult.success = false;
        finalResult.error = `步骤 ${i + 1} 中缺少选择器值`;
        return finalResult;
      }
      
      // 创建选择器
      const selector: SelectorInput = {
        type_: selectorType,
        value: selectorValue
      };
      
      // 获取可选的文本参数(用于input_text和key_press操作)
      const inputText = (action === "input_text" || action === "key_press") ? step.text : undefined;
      
      // 执行元素操作
      const result = await performElementAction(appName, selector, action, inputText);
      
      // 如果步骤执行失败，记录错误并终止执行
      if (!result.success) {
        finalResult.success = false;
        finalResult.error = `步骤 ${i + 1} 执行失败: ${result.error || "未知错误"}`;
        return finalResult;
      }
    }
    
    // 检查是否需要等待
    if (step.wait) {
      console.log(`等待 ${step.wait} 毫秒`);
      await new Promise(resolve => setTimeout(resolve, step.wait));
    }
  }
  
  // 所有步骤都成功执行
  return finalResult;
}

// 运行自动化脚本
export async function runAutomationScript(script: string): Promise<ElementActionResult> {
  try {
    // 解析脚本内容
    const scriptData = JSON.parse(script);
    
    // 检查是否是多步骤脚本
    if (Array.isArray(scriptData.steps)) {
      return await runMultiStepScript(scriptData.steps);
    }
    
    // 单步骤脚本的处理逻辑
    // 提取应用程序名称
    const appName = scriptData.app;
    if (!appName) {
      return {
        success: false,
        error: "脚本中缺少应用程序名称"
      };
    }
    
    // 提取选择器信息
    const selectorType = scriptData.selector?.type_;
    if (!selectorType) {
      return {
        success: false,
        error: "脚本中缺少选择器类型"
      };
    }
    
    const selectorValue = scriptData.selector?.value;
    if (!selectorValue) {
      return {
        success: false,
        error: "脚本中缺少选择器值"
      };
    }
    
    // 提取操作（默认为点击）
    const action = scriptData.action || "click";
    
    // 创建选择器
    const selector: SelectorInput = {
      type_: selectorType,
      value: selectorValue
    };
    
    // 执行元素操作
    return await performElementAction(appName, selector, action);
  } catch (error) {
    console.error("运行自动化脚本失败:", error);
    return {
      success: false,
      error: `运行自动化脚本失败: ${error}`
    };
  }
}

// 删除自动化脚本
export async function deleteAutomationScript(path: string): Promise<void> {
  try {
    // 检查文件是否存在
    const fileExists = await exists(path);
    if (!fileExists) {
      throw new Error("文件不存在");
    }
    
    // 使用 Tauri 的 removeFile API
    await removeFile(path);
    
    console.log("脚本已删除:", path);
  } catch (error) {
    console.error("无法删除脚本文件:", error);
    throw new Error(`无法删除脚本文件: ${error}`);
  }
}

// 编辑并保存自动化脚本
export async function updateAutomationScript(path: string, newContent: string): Promise<void> {
  try {
    // 检查文件是否存在
    const fileExists = await exists(path);
    if (!fileExists) {
      throw new Error("文件不存在");
    }
    
    // 验证新内容是有效的JSON
    JSON.parse(newContent);
    
    // 使用 Tauri 的 writeTextFile API
    await writeTextFile(path, newContent);
    
    console.log("脚本已更新:", path);
  } catch (error) {
    console.error("无法更新脚本:", error);
    throw new Error(`无法更新脚本: ${error}`);
  }
}

// 获取脚本预览信息
export async function getScriptPreview(path: string): Promise<ScriptPreview> {
  try {
    // 读取脚本文件内容
    const content = await readTextFile(path);
    
    // 解析脚本内容
    const scriptData = JSON.parse(content);
    
    // 提取预览信息
    const isMultiStep = Array.isArray(scriptData.steps);
    const stepCount = isMultiStep ? scriptData.steps.length : 1;
    
    const targetApp = isMultiStep
      ? (scriptData.steps[0]?.app || "未知应用")
      : (scriptData.app || "未知应用");
    
    // 提取脚本名称（从文件路径中提取）
    const pathParts = path.split(/[/\\]/);
    const scriptName = pathParts[pathParts.length - 1] || "未知脚本";
    
    return {
      name: scriptName,
      path: path,
      target_app: targetApp,
      step_count: stepCount,
      is_multi_step: isMultiStep
    };
  } catch (error) {
    console.error("无法获取脚本预览:", error);
    throw new Error(`无法获取脚本预览: ${error}`);
  }
}

// 基于模板创建新脚本
export async function createScriptFromTemplate(templateType: ScriptTemplateType): Promise<string> {
  try {
    // 获取模板内容
    const templateContent = getScriptTemplate(templateType);
    
    // 保存脚本
    await saveAutomationScript(templateContent);
    
    // 返回新创建的脚本内容
    return templateContent;
  } catch (error) {
    console.error("无法创建脚本模板:", error);
    throw new Error(`无法创建脚本模板: ${error}`);
  }
} 
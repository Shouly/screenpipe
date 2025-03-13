import logging
from typing import List, Dict, Any, Optional
import json
from datetime import datetime, timedelta
import re
from collections import defaultdict
from elasticsearch import AsyncElasticsearch

from ..core.config import settings
from .query_service import QueryService

# 导入OpenAI库，用于大模型分析
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logging.warning("OpenAI库未安装，将无法进行模式识别")

logger = logging.getLogger(__name__)

class PatternRecognitionService:
    """
    模式识别服务，用于分析用户界面交互数据中的重复模式
    """
    
    def __init__(self, openai_api_key: Optional[str] = None, es_client: Optional[AsyncElasticsearch] = None):
        self.openai_api_key = openai_api_key
        self.es_client = es_client
        self.client = None
        self.use_openai = False
        self._initialize_client()
        if es_client:
            self.query_service = QueryService(es_client)
        else:
            self.query_service = None
    
    def _initialize_client(self):
        """初始化OpenAI客户端"""
        if OPENAI_AVAILABLE and self.openai_api_key:
            self.client = OpenAI(
                api_key=self.openai_api_key,
                base_url="https://openrouter.ai/api/v1",
            )
            self.use_openai = True
            logger.info("OpenAI客户端初始化成功")
        else:
            self.use_openai = False
            self.client = None
            logger.warning("未提供OpenAI API密钥或OpenAI库未安装，模式识别功能将不可用")
    
    def set_api_key(self, api_key: str):
        """设置API密钥并重新初始化客户端"""
        if not api_key:
            logger.warning("提供的API密钥为空")
            return
        
        self.openai_api_key = api_key
        self._initialize_client()
    
    async def get_ui_data_from_es(
        self, 
        client_id: str, 
        start_time: datetime, 
        end_time: datetime, 
        limit: int = 200
    ) -> List[Dict[str, Any]]:
        """
        从Elasticsearch获取UI监控数据
        
        Args:
            client_id: 客户端ID
            start_time: 开始时间
            end_time: 结束时间
            limit: 最大记录数
            
        Returns:
            包含UI监控数据的列表
        """
        if not self.es_client:
            logger.error("ES客户端未初始化")
            return []
        
        try:
            if self.query_service:
                # 使用QueryService获取数据
                result = await self.query_service.get_ui_monitoring_by_time(
                    client_id=client_id,
                    start_time=start_time,
                    end_time=end_time,
                    limit=limit,
                    sort_order="asc"  # 按时间升序排序
                )
                
                # 处理结果
                items = []
                for item in result["items"]:
                    items.append({
                        "timestamp": item["timestamp"],
                        "app": item["app"],
                        "window": item["window"],
                        "text_output": item["text_output"],
                        "initial_traversal_at": item.get("initial_traversal_at"),
                        "metadata": {
                            "platform": item.get("platform"),
                            "os": item.get("os"),
                            "os_version": item.get("os_version"),
                            "hostname": item.get("hostname"),
                            "app_version": item.get("app_version")
                        }
                    })
                
                logger.info(f"从ES获取了{len(items)}条UI监控记录")
                return items
            
        except Exception as e:
            logger.error(f"从ES获取UI监控数据失败: {str(e)}")
            return []
            
    async def analyze_ui_data(self, ui_data: List[Dict[str, Any]], time_window: int = 3600) -> Dict[str, Any]:
        """
        分析UI监控数据中的模式
        
        Args:
            ui_data: 包含UI监控数据的列表
            time_window: 分析窗口大小（秒）
            
        Returns:
            识别出的模式和建议
        """
        if not ui_data:
            return {"patterns": [], "message": "没有提供数据进行分析"}
        
        if not self.use_openai:
            return {"patterns": [], "message": "未配置OpenAI API密钥，无法进行模式分析"}
        
        # 按时间排序
        sorted_data = sorted(ui_data, key=lambda x: x.get("timestamp", ""))
        
        # 使用大模型进行模式分析
        patterns = await self._analyze_with_llm(sorted_data)
        
        return {
            "patterns": patterns,
            "message": f"分析了{len(ui_data)}条UI监控记录，识别出{len(patterns)}个潜在模式"
        }
    
    async def analyze_client_data(
        self, 
        client_id: str, 
        start_time: Optional[datetime] = None, 
        end_time: Optional[datetime] = None, 
        limit: int = 200
    ) -> Dict[str, Any]:
        """
        分析特定客户端在指定时间范围内的UI监控数据
        
        Args:
            client_id: 客户端ID
            start_time: 开始时间，如果为None则默认为1小时前
            end_time: 结束时间，如果为None则默认为当前时间
            limit: 最大记录数
            
        Returns:
            识别出的模式和建议
        """
        # 设置默认时间范围
        if end_time is None:
            end_time = datetime.utcnow()  # 使用UTC时间
        if start_time is None:
            start_time = end_time - timedelta(hours=1)  # 默认分析1小时的数据
        
        # 从ES获取UI监控数据
        ui_data = await self.get_ui_data_from_es(client_id, start_time, end_time, limit)
        
        if not ui_data:
            return {
                "patterns": [],
                "message": f"未找到客户端 {client_id} 在指定时间范围内的UI监控数据",
                "data_source": {
                    "client_id": client_id,
                    "start_time": start_time.isoformat(),
                    "end_time": end_time.isoformat(),
                    "limit": limit
                }
            }
        
        # 分析UI监控数据
        result = await self.analyze_ui_data(ui_data)
        
        # 添加数据源信息
        result["data_source"] = {
            "client_id": client_id,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "record_count": len(ui_data),
            "limit": limit
        }
        
        return result
    
    async def _analyze_with_llm(self, ui_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """使用大模型分析UI交互模式"""
        if not self.use_openai:
            return []
        
        patterns = []
        
        try:
            # 准备输入数据
            # 为了避免超出token限制，我们只取最近的50条记录
            recent_data = ui_data[-50:] if len(ui_data) > 50 else ui_data
            
            # 构建提示
            prompt = """分析以下用户界面交互数据，首先总结用户的工作内容和行为特征，然后识别可能的工作模式和重复任务。

这些数据来自用户界面监控，包含应用程序、窗口和UI元素的交互信息，按时间顺序排列。请按以下步骤分析：

1. 工作内容总结：
   - 用户主要使用了哪些应用程序？
   - 在每个应用中执行了什么任务？
   - 工作过程的时间特征（持续时间、频率等）
   - 是否有明显的工作目标或任务流程？

2. 行为特征分析：
   - 应用程序使用习惯（使用频率、切换模式等）
   - 窗口操作习惯（多窗口管理、布局偏好等）
   - UI交互习惯（常用操作、快捷键使用等）
   - 工作节奏（高频操作时段、停顿模式等）

3. 效率瓶颈识别：
   - 重复性操作
   - 耗时步骤
   - 频繁切换
   - 操作冗余

数据如下：

"""
            for item in recent_data:
                timestamp = datetime.fromisoformat(item["timestamp"]).strftime("%Y-%m-%d %H:%M:%S")
                app = item["app"]
                window = item["window"]
                text_output = item.get("text_output", "")
                metadata = item.get("metadata", {})
                platform = metadata.get("platform", "")
                os_info = f"{metadata.get('os', '')} {metadata.get('os_version', '')}"
                
                prompt += f"[{timestamp}] 应用: {app} | 窗口: {window} | 平台: {platform} {os_info}\n"
                prompt += f"UI元素: {text_output[:500]}...\n\n"
            
            prompt += """
请以JSON格式返回分析结果，包含以下部分：

1. summary: 工作内容和行为特征的总结
2. patterns: 识别出的具体模式列表

返回格式示例：
```json
{
  "summary": {
    "work_content": "用户主要在Chrome和Excel之间工作，进行数据查询和录入任务。工作持续约45分钟，主要集中在处理客户数据。",
    "behavior_traits": "倾向于同时打开多个Chrome标签页，频繁在不同表格间切换。经常使用复制粘贴操作，很少使用快捷键。",
    "efficiency_bottlenecks": "数据录入过程中存在大量重复操作，频繁的应用切换降低了工作效率。"
  },
  "patterns": [
    {
      "type": "workflow",
      "description": "在Chrome中查询客户信息后切换到Excel录入，这个过程平均每3-5分钟重复一次",
      "confidence": 0.92,
      "suggestion": "开发浏览器扩展自动采集数据，并提供一键导入Excel的功能"
    },
    {
      "type": "ui_interaction",
      "description": "频繁使用鼠标在Excel中切换单元格和工作表",
      "confidence": 0.85,
      "suggestion": "提供Excel快捷键培训，开发单元格快速导航工具"
    }
  ]
}
```
请确保返回的是有效的JSON格式。只返回JSON对象，不要包含其他文本。"""
            
            # 调用OpenAI API
            response = None
            try:
                response = self.client.chat.completions.create(
                    model="anthropic/claude-3.7-sonnet",
                    messages=[
                        {"role": "system", "content": "你是一个专门分析用户工作行为和界面交互模式的助手。你善于从用户的应用程序使用记录中总结工作内容，识别行为特征，并发现可优化的机会。你的回答必须是有效的JSON格式。"},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=2000,
                    response_format={"type": "json_object"}
                )
            except Exception as api_error:
                logger.error(f"调用OpenAI API失败: {str(api_error)}")
                return []
                
            # 检查响应是否有效
            if not response or not hasattr(response, 'choices') or not response.choices:
                logger.error("OpenAI API返回了无效的响应")
                return []
            
            # 检查choices[0]是否有效
            if not hasattr(response.choices[0], 'message') or not response.choices[0].message:
                logger.error("OpenAI API响应中没有message字段")
                return []
            
            # 检查message.content是否有效
            if not hasattr(response.choices[0].message, 'content') or not response.choices[0].message.content:
                logger.error("OpenAI API响应中没有content字段")
                return []
            
            # 解析响应
            analysis = response.choices[0].message.content
            
            try:
                # 检查是否是Markdown代码块，如果是则提取其中的JSON
                if analysis.startswith("```") and "```" in analysis[3:]:
                    # 提取代码块中的内容
                    start_idx = analysis.find("\n", 3) + 1  # 跳过```json这一行
                    end_idx = analysis.rfind("```")
                    if start_idx > 0 and end_idx > start_idx:
                        analysis = analysis[start_idx:end_idx].strip()
                
                # 尝试解析JSON响应
                result_data = json.loads(analysis)
                
                # 提取patterns
                if isinstance(result_data, dict):
                    patterns = result_data.get("patterns", [])
                    
                    # 添加summary到每个pattern中
                    summary = result_data.get("summary", {})
                    for pattern in patterns:
                        pattern["context"] = summary
                else:
                    patterns = []
                    
                # 添加分数字段
                for pattern in patterns:
                    confidence = pattern.get("confidence", 0.5)
                    pattern["score"] = round(confidence, 2)
                
                # 按分数排序
                patterns = sorted(patterns, key=lambda x: x.get("score", 0), reverse=True)
                
            except json.JSONDecodeError as e:
                logger.error(f"解析LLM响应失败: {str(e)}")
                logger.error(f"原始响应: {analysis}")
                
                # 尝试使用正则表达式提取模式
                pattern_matches = re.findall(r'"type":\s*"([^"]+)"[^}]+"description":\s*"([^"]+)"[^}]+"confidence":\s*([\d.]+)[^}]+"suggestion":\s*"([^"]+)"', analysis)
                
                for match in pattern_matches:
                    pattern_type, description, confidence, suggestion = match
                    try:
                        conf_value = float(confidence)
                        patterns.append({
                            "type": pattern_type,
                            "description": description,
                            "confidence": conf_value,
                            "score": round(conf_value, 2),
                            "suggestion": suggestion
                        })
                    except ValueError:
                        continue
                
                # 按分数排序
                patterns = sorted(patterns, key=lambda x: x.get("score", 0), reverse=True)
            
        except Exception as e:
            logger.error(f"LLM分析失败: {str(e)}")
        
        return patterns 
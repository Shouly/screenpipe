import logging
from typing import List, Dict, Any, Optional
import json
from datetime import datetime, timedelta
from elasticsearch import AsyncElasticsearch

from ..core.config import settings
from .query_service import QueryService

# 导入OpenAI库，用于大模型分析
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logging.warning("OpenAI库未安装，将无法进行工作内容分析")

logger = logging.getLogger(__name__)

class WorkSummaryService:
    """
    工作内容总结服务，用于分析和总结用户的工作内容和行为
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
            logger.warning("未提供OpenAI API密钥或OpenAI库未安装，工作内容分析功能将不可用")
    
    def set_api_key(self, api_key: str):
        """设置API密钥并重新初始化客户端"""
        if not api_key:
            logger.warning("提供的API密钥为空")
            return
        
        self.openai_api_key = api_key
        self._initialize_client()
    
    async def get_work_data(
        self, 
        client_id: str, 
        start_time: datetime, 
        end_time: datetime
    ) -> Dict[str, Any]:
        """
        获取用户的工作数据，包括UI监控数据和应用使用统计
        
        Args:
            client_id: 客户端ID
            start_time: 开始时间
            end_time: 结束时间
            
        Returns:
            包含工作数据的字典
        """
        if not self.es_client:
            logger.error("ES客户端未初始化")
            return {}
        
        try:
            # 获取UI监控数据
            ui_result = await self.query_service.get_ui_monitoring_by_time(
                client_id=client_id,
                start_time=start_time,
                end_time=end_time,
                limit=1000,  # 获取更多数据以便分析
                sort_order="asc"
            )
            
            # 处理UI监控数据
            ui_data = []
            app_stats = {}  # 应用使用统计
            window_stats = {}  # 窗口使用统计
            
            for item in ui_result["items"]:
                # 添加到UI数据列表
                ui_data.append({
                    "timestamp": item["timestamp"],
                    "app": item["app"],
                    "window": item["window"],
                    "text_output": item["text_output"],
                    "metadata": {
                        "platform": item.get("platform"),
                        "os": item.get("os"),
                        "os_version": item.get("os_version"),
                        "hostname": item.get("hostname"),
                        "app_version": item.get("app_version")
                    }
                })
                
                # 更新应用使用统计
                app = item["app"]
                if app not in app_stats:
                    app_stats[app] = {
                        "count": 0,
                        "windows": set(),
                        "first_seen": item["timestamp"],
                        "last_seen": item["timestamp"]
                    }
                app_stats[app]["count"] += 1
                app_stats[app]["windows"].add(item["window"])
                app_stats[app]["last_seen"] = item["timestamp"]
                
                # 更新窗口使用统计
                window_key = f"{app}::{item['window']}"
                if window_key not in window_stats:
                    window_stats[window_key] = {
                        "app": app,
                        "window": item["window"],
                        "count": 0,
                        "first_seen": item["timestamp"],
                        "last_seen": item["timestamp"]
                    }
                window_stats[window_key]["count"] += 1
                window_stats[window_key]["last_seen"] = item["timestamp"]
            
            # 转换统计数据为列表格式
            app_stats_list = []
            for app, stats in app_stats.items():
                app_stats_list.append({
                    "app": app,
                    "interaction_count": stats["count"],
                    "window_count": len(stats["windows"]),
                    "duration_minutes": round((datetime.fromisoformat(stats["last_seen"]) - 
                                           datetime.fromisoformat(stats["first_seen"])).total_seconds() / 60, 1)
                })
            
            window_stats_list = []
            for stats in window_stats.values():
                window_stats_list.append({
                    "app": stats["app"],
                    "window": stats["window"],
                    "interaction_count": stats["count"],
                    "duration_minutes": round((datetime.fromisoformat(stats["last_seen"]) - 
                                           datetime.fromisoformat(stats["first_seen"])).total_seconds() / 60, 1)
                })
            
            return {
                "ui_data": ui_data,
                "app_stats": sorted(app_stats_list, key=lambda x: x["interaction_count"], reverse=True),
                "window_stats": sorted(window_stats_list, key=lambda x: x["interaction_count"], reverse=True),
                "total_records": len(ui_data)
            }
            
        except Exception as e:
            logger.error(f"获取工作数据失败: {str(e)}")
            return {}
    
    async def analyze_work_content(
        self, 
        client_id: str, 
        hours: int = 4
    ) -> Dict[str, Any]:
        """
        分析用户指定时间范围内的工作内容
        
        Args:
            client_id: 客户端ID
            hours: 要分析的小时数，默认为4小时
            
        Returns:
            工作内容分析结果
        """
        if not self.use_openai:
            return {
                "error": "未配置OpenAI API密钥，无法进行工作内容分析",
                "success": False
            }
        
        # 设置时间范围
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        # 获取工作数据
        work_data = await self.get_work_data(client_id, start_time, end_time)
        
        if not work_data or not work_data.get("ui_data"):
            return {
                "error": f"未找到客户端 {client_id} 在过去{hours}小时内的工作数据",
                "success": False
            }
        
        try:
            # 构建提示
            prompt = f"""分析以下用户在过去{hours}小时内的工作数据，生成详细的工作内容总结。

工作数据统计：
1. 总交互记录数：{work_data['total_records']}
2. 应用程序使用情况：
{self._format_app_stats(work_data['app_stats'])}

3. 主要窗口活动：
{self._format_window_stats(work_data['window_stats'][:10])}  # 只显示前10个最活跃的窗口

详细交互记录：
"""
            # 添加最近的50条交互记录
            recent_data = work_data['ui_data'][-50:]
            for item in recent_data:
                timestamp = datetime.fromisoformat(item["timestamp"]).strftime("%Y-%m-%d %H:%M:%S")
                prompt += f"[{timestamp}] 应用: {item['app']} | 窗口: {item['window']}\n"
                prompt += f"UI元素: {item['text_output'][:200]}...\n\n"
            
            prompt += """
请生成一个详细的工作内容总结，包含以下方面：

1. 工作概述：
   - 主要工作内容和目标
   - 工作时间分布
   - 主要使用的应用程序和工具

2. 工作模式分析：
   - 工作习惯和偏好
   - 任务切换和多任务处理
   - 工作节奏和专注度

3. 效率分析：
   - 高效工作的时段
   - 潜在的效率瓶颈
   - 改进建议

请以JSON格式返回分析结果，格式如下：
```json
{
  "work_summary": {
    "overview": {
      "main_activities": "主要工作内容描述",
      "time_distribution": "工作时间分布情况",
      "key_applications": ["主要应用1", "主要应用2"]
    },
    "work_patterns": {
      "habits": "工作习惯描述",
      "task_switching": "任务切换模式",
      "work_rhythm": "工作节奏特点"
    },
    "efficiency_analysis": {
      "productive_periods": "高效工作时段",
      "bottlenecks": ["效率瓶颈1", "效率瓶颈2"],
      "improvement_suggestions": ["建议1", "建议2"]
    }
  }
}
```
请确保返回的是有效的JSON格式。只返回JSON对象，不要包含其他文本。"""

            # 调用OpenAI API
            response = await self._analyze_with_llm(prompt)
            
            if response and isinstance(response, dict):
                return {
                    "success": True,
                    "data": {
                        "summary": response,
                        "stats": {
                            "total_records": work_data["total_records"],
                            "app_stats": work_data["app_stats"][:5],  # 只返回前5个最常用的应用
                            "time_range": {
                                "start": start_time.isoformat(),
                                "end": end_time.isoformat()
                            }
                        }
                    }
                }
            else:
                return {
                    "error": "工作内容分析失败",
                    "success": False
                }
            
        except Exception as e:
            logger.error(f"分析工作内容失败: {str(e)}")
            return {
                "error": f"分析工作内容时发生错误: {str(e)}",
                "success": False
            }
    
    def _format_app_stats(self, app_stats: List[Dict[str, Any]]) -> str:
        """格式化应用程序统计信息"""
        result = ""
        for stat in app_stats:
            result += (f"- {stat['app']}: {stat['interaction_count']}次交互, "
                      f"{stat['window_count']}个窗口, {stat['duration_minutes']}分钟\n")
        return result
    
    def _format_window_stats(self, window_stats: List[Dict[str, Any]]) -> str:
        """格式化窗口统计信息"""
        result = ""
        for stat in window_stats:
            result += (f"- {stat['app']} - {stat['window']}: "
                      f"{stat['interaction_count']}次交互, {stat['duration_minutes']}分钟\n")
        return result
    
    async def _analyze_with_llm(self, prompt: str) -> Optional[Dict[str, Any]]:
        """使用LLM分析数据"""
        try:
            response = self.client.chat.completions.create(
                model="anthropic/claude-3.7-sonnet",
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个专门分析用户工作内容和行为的助手。你善于从用户的应用程序使用记录中总结工作内容，理解工作模式，并提供改进建议。你的回答必须是有效的JSON格式。"
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            
            if not response or not response.choices:
                return None
            
            content = response.choices[0].message.content
            
            # 处理可能的Markdown代码块
            if content.startswith("```") and "```" in content[3:]:
                start_idx = content.find("\n", 3) + 1
                end_idx = content.rfind("```")
                if start_idx > 0 and end_idx > start_idx:
                    content = content[start_idx:end_idx].strip()
            
            return json.loads(content)
            
        except Exception as e:
            logger.error(f"LLM分析失败: {str(e)}")
            return None 
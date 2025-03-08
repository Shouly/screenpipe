from datetime import datetime, timedelta
import logging
from elasticsearch import AsyncElasticsearch
from ..core.config import settings

logger = logging.getLogger(__name__)

class QueryService:
    def __init__(self, es_client: AsyncElasticsearch):
        self.es_client = es_client
    
    async def get_ui_monitoring_by_time(self, 
                                        client_id: str = None, 
                                        start_time: datetime = None, 
                                        end_time: datetime = None, 
                                        app: str = None,
                                        window: str = None,
                                        limit: int = 100,
                                        offset: int = 0,
                                        sort_order: str = "desc"):
        """
        按时间顺序获取UI监控数据
        
        Args:
            client_id: 客户端ID，可选
            start_time: 开始时间，可选
            end_time: 结束时间，可选
            app: 应用名称，可选
            window: 窗口名称，可选
            limit: 返回结果数量限制，默认100
            offset: 分页偏移量，默认0
            sort_order: 排序顺序，"asc"或"desc"，默认"desc"
            
        Returns:
            dict: 包含UI监控数据的字典
        """
        try:
            # 注意：ES中的时间戳直接是北京时间，而start_time和end_time是UTC时间
            # 我们需要将UTC时间转换为北京时间进行比较
            
            # 构建查询
            query = {"bool": {"must": []}}
            
            # 添加客户端ID过滤
            if client_id:
                query["bool"]["must"].append({"term": {"client_id": client_id}})
            
            # 添加时间范围过滤
            if start_time or end_time:
                time_range = {}
                if start_time:
                    time_range["gte"] = start_time.isoformat()
                if end_time:
                    time_range["lte"] = end_time.isoformat()
                query["bool"]["must"].append({"range": {"timestamp": time_range}})
            
            # 添加应用名称过滤
            if app:
                query["bool"]["must"].append({"term": {"app": app}})
            
            # 添加窗口名称过滤
            if window:
                query["bool"]["must"].append({"term": {"window": window}})
            
            # 执行查询
            index_name = f"{settings.ES_INDEX_PREFIX}-ui-monitoring"
            
            result = await self.es_client.search(
                index=index_name,
                body={
                    "query": query,
                    "sort": [{"timestamp": sort_order}],
                    "from": offset,
                    "size": limit
                }
            )
            
            # 处理结果
            total = result["hits"]["total"]["value"]
            items = [hit["_source"] for hit in result["hits"]["hits"]]
            
            return {
                "total": total,
                "items": items,
                "limit": limit,
                "offset": offset
            }
            
        except Exception as e:
            logger.error(f"Error querying UI monitoring data: {e}")
            raise
    
    async def get_ui_monitoring_apps(self, client_id: str = None):
        """
        获取所有UI监控的应用名称列表
        
        Args:
            client_id: 客户端ID，可选
            
        Returns:
            list: 应用名称列表
        """
        try:
            # 构建查询
            query = {"bool": {"must": []}}
            
            # 添加客户端ID过滤
            if client_id:
                query["bool"]["must"].append({"term": {"client_id": client_id}})
            
            # 执行聚合查询
            index_name = f"{settings.ES_INDEX_PREFIX}-ui-monitoring"
            
            result = await self.es_client.search(
                index=index_name,
                body={
                    "query": query,
                    "size": 0,
                    "aggs": {
                        "apps": {
                            "terms": {
                                "field": "app",
                                "size": 1000
                            }
                        }
                    }
                }
            )
            
            # 处理结果
            apps = [bucket["key"] for bucket in result["aggregations"]["apps"]["buckets"]]
            
            return apps
            
        except Exception as e:
            logger.error(f"Error querying UI monitoring apps: {e}")
            raise
    
    async def get_ui_monitoring_windows(self, client_id: str = None, app: str = None):
        """
        获取所有UI监控的窗口名称列表
        
        Args:
            client_id: 客户端ID，可选
            app: 应用名称，可选
            
        Returns:
            list: 窗口名称列表
        """
        try:
            # 构建查询
            query = {"bool": {"must": []}}
            
            # 添加客户端ID过滤
            if client_id:
                query["bool"]["must"].append({"term": {"client_id": client_id}})
            
            # 添加应用名称过滤
            if app:
                query["bool"]["must"].append({"term": {"app": app}})
            
            # 执行聚合查询
            index_name = f"{settings.ES_INDEX_PREFIX}-ui-monitoring"
            
            result = await self.es_client.search(
                index=index_name,
                body={
                    "query": query,
                    "size": 0,
                    "aggs": {
                        "windows": {
                            "terms": {
                                "field": "window",
                                "size": 1000
                            }
                        }
                    }
                }
            )
            
            # 处理结果
            windows = [bucket["key"] for bucket in result["aggregations"]["windows"]["buckets"]]
            
            return windows
            
        except Exception as e:
            logger.error(f"Error querying UI monitoring windows: {e}")
            raise

    async def get_ocr_text_by_time(self, 
                                  client_id: str = None, 
                                  start_time: datetime = None, 
                                  end_time: datetime = None, 
                                  app_name: str = None,
                                  window_name: str = None,
                                  focused: bool = None,
                                  limit: int = 100,
                                  offset: int = 0,
                                  sort_order: str = "desc"):
        """
        按时间顺序获取OCR文本数据
        
        Args:
            client_id: 客户端ID，可选
            start_time: 开始时间，可选
            end_time: 结束时间，可选
            app_name: 应用名称，可选
            window_name: 窗口名称，可选
            focused: 是否聚焦，可选
            limit: 返回结果数量限制，默认100
            offset: 分页偏移量，默认0
            sort_order: 排序顺序，"asc"或"desc"，默认"desc"
            
        Returns:
            dict: 包含OCR文本数据的字典
        """
        try:
            # 构建查询
            query = {"bool": {"must": []}}
            
            # 添加客户端ID过滤
            if client_id:
                query["bool"]["must"].append({"term": {"client_id": client_id}})
            
            # 添加时间范围过滤
            if start_time or end_time:
                time_range = {}
                if start_time:
                    time_range["gte"] = start_time.isoformat()
                if end_time:
                    time_range["lte"] = end_time.isoformat()
                query["bool"]["must"].append({"range": {"timestamp": time_range}})
            
            # 添加应用名称过滤
            if app_name:
                query["bool"]["must"].append({"term": {"app_name": app_name}})
            
            # 添加窗口名称过滤
            if window_name:
                query["bool"]["must"].append({"term": {"window_name": window_name}})
            
            # 添加聚焦状态过滤
            if focused is not None:
                query["bool"]["must"].append({"term": {"focused": focused}})
            
            # 执行查询
            index_name = f"{settings.ES_INDEX_PREFIX}-ocr-text"
            
            result = await self.es_client.search(
                index=index_name,
                body={
                    "query": query,
                    "sort": [{"timestamp": sort_order}],
                    "from": offset,
                    "size": limit
                }
            )
            
            # 处理结果
            total = result["hits"]["total"]["value"]
            items = [hit["_source"] for hit in result["hits"]["hits"]]
            
            return {
                "total": total,
                "items": items,
                "limit": limit,
                "offset": offset
            }
            
        except Exception as e:
            logger.error(f"Error querying OCR text data: {e}")
            raise

    async def get_ocr_text_apps(self, client_id: str = None):
        """
        获取所有OCR文本的应用名称列表
        
        Args:
            client_id: 客户端ID，可选
            
        Returns:
            list: 应用名称列表
        """
        try:
            # 构建查询
            query = {"bool": {"must": []}}
            
            # 添加客户端ID过滤
            if client_id:
                query["bool"]["must"].append({"term": {"client_id": client_id}})
            
            # 执行聚合查询
            index_name = f"{settings.ES_INDEX_PREFIX}-ocr-text"
            
            result = await self.es_client.search(
                index=index_name,
                body={
                    "query": query,
                    "size": 0,
                    "aggs": {
                        "apps": {
                            "terms": {
                                "field": "app_name",
                                "size": 1000
                            }
                        }
                    }
                }
            )
            
            # 处理结果
            apps = [bucket["key"] for bucket in result["aggregations"]["apps"]["buckets"]]
            
            return apps
            
        except Exception as e:
            logger.error(f"Error querying OCR text apps: {e}")
            raise

    async def get_ocr_text_windows(self, client_id: str = None, app_name: str = None):
        """
        获取所有OCR文本的窗口名称列表
        
        Args:
            client_id: 客户端ID，可选
            app_name: 应用名称，可选
            
        Returns:
            list: 窗口名称列表
        """
        try:
            # 构建查询
            query = {"bool": {"must": []}}
            
            # 添加客户端ID过滤
            if client_id:
                query["bool"]["must"].append({"term": {"client_id": client_id}})
            
            # 添加应用名称过滤
            if app_name:
                query["bool"]["must"].append({"term": {"app_name": app_name}})
            
            # 执行聚合查询
            index_name = f"{settings.ES_INDEX_PREFIX}-ocr-text"
            
            result = await self.es_client.search(
                index=index_name,
                body={
                    "query": query,
                    "size": 0,
                    "aggs": {
                        "windows": {
                            "terms": {
                                "field": "window_name",
                                "size": 1000
                            }
                        }
                    }
                }
            )
            
            # 处理结果
            windows = [bucket["key"] for bucket in result["aggregations"]["windows"]["buckets"]]
            
            return windows
            
        except Exception as e:
            logger.error(f"Error querying OCR text windows: {e}")
            raise 
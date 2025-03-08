from fastapi import APIRouter, Depends, Query
from elasticsearch import AsyncElasticsearch
from datetime import datetime, timedelta
import logging
from typing import List, Optional

from ...db.elasticsearch import get_es_client
from ...services.query_service import QueryService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/ui-monitoring")
async def get_ui_monitoring(
    client_id: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    app: Optional[str] = None,
    window: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    es_client: AsyncElasticsearch = Depends(get_es_client)
):
    """
    获取UI监控数据，支持按时间、应用和窗口过滤
    """
    try:
        # 如果没有指定时间范围，默认查询最近24小时
        if not start_time and not end_time:
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(hours=24)
        
        # 创建查询服务
        query_service = QueryService(es_client)
        
        # 执行查询
        result = await query_service.get_ui_monitoring_by_time(
            client_id=client_id,
            start_time=start_time,
            end_time=end_time,
            app=app,
            window=window,
            limit=limit,
            offset=offset,
            sort_order=sort_order
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error in UI monitoring query API: {e}")
        raise

@router.get("/ui-monitoring/apps", response_model=List[str])
async def get_ui_monitoring_apps(
    client_id: Optional[str] = None,
    es_client: AsyncElasticsearch = Depends(get_es_client)
):
    """
    获取所有UI监控的应用名称列表
    """
    try:
        # 创建查询服务
        query_service = QueryService(es_client)
        
        # 执行查询
        result = await query_service.get_ui_monitoring_apps(client_id=client_id)
        
        return result
        
    except Exception as e:
        logger.error(f"Error in UI monitoring apps query API: {e}")
        raise

@router.get("/ui-monitoring/windows", response_model=List[str])
async def get_ui_monitoring_windows(
    client_id: Optional[str] = None,
    app: Optional[str] = None,
    es_client: AsyncElasticsearch = Depends(get_es_client)
):
    """
    获取所有UI监控的窗口名称列表
    """
    try:
        # 创建查询服务
        query_service = QueryService(es_client)
        
        # 执行查询
        result = await query_service.get_ui_monitoring_windows(
            client_id=client_id,
            app=app
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error in UI monitoring windows query API: {e}")
        raise

@router.get("/ocr-text")
async def get_ocr_text(
    client_id: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    app_name: Optional[str] = None,
    window_name: Optional[str] = None,
    focused: Optional[bool] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    es_client: AsyncElasticsearch = Depends(get_es_client)
):
    """
    获取OCR文本数据，支持按时间、应用和窗口过滤
    """
    try:
        # 如果没有指定时间范围，默认查询最近24小时
        if not start_time and not end_time:
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(hours=24)
        
        # 创建查询服务
        query_service = QueryService(es_client)
        
        # 执行查询
        result = await query_service.get_ocr_text_by_time(
            client_id=client_id,
            start_time=start_time,
            end_time=end_time,
            app_name=app_name,
            window_name=window_name,
            focused=focused,
            limit=limit,
            offset=offset,
            sort_order=sort_order
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error in OCR text query API: {e}")
        raise

@router.get("/ocr-text/apps", response_model=List[str])
async def get_ocr_text_apps(
    client_id: Optional[str] = None,
    es_client: AsyncElasticsearch = Depends(get_es_client)
):
    """
    获取所有OCR文本的应用名称列表
    """
    try:
        # 创建查询服务
        query_service = QueryService(es_client)
        
        # 执行查询
        result = await query_service.get_ocr_text_apps(client_id=client_id)
        
        return result
        
    except Exception as e:
        logger.error(f"Error in OCR text apps query API: {e}")
        raise

@router.get("/ocr-text/windows", response_model=List[str])
async def get_ocr_text_windows(
    client_id: Optional[str] = None,
    app_name: Optional[str] = None,
    es_client: AsyncElasticsearch = Depends(get_es_client)
):
    """
    获取所有OCR文本的窗口名称列表
    """
    try:
        # 创建查询服务
        query_service = QueryService(es_client)
        
        # 执行查询
        result = await query_service.get_ocr_text_windows(
            client_id=client_id,
            app_name=app_name
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error in OCR text windows query API: {e}")
        raise 
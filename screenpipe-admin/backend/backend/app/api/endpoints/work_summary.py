from fastapi import APIRouter, Depends, Query, HTTPException
from elasticsearch import AsyncElasticsearch
from datetime import datetime, timedelta
import logging
from typing import Optional

from ...db.elasticsearch import get_es_client
from ...services.work_summary_service import WorkSummaryService
from ...core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/analyze")
async def analyze_work_content(
    client_id: str,
    hours: int = Query(4, ge=1, le=24),
    es_client: AsyncElasticsearch = Depends(get_es_client)
):
    """
    分析用户在指定时间范围内的工作内容
    
    Args:
        client_id: 客户端ID
        hours: 要分析的小时数，默认为4小时，最大24小时
        
    Returns:
        工作内容分析结果
    """
    try:
        # 创建工作内容总结服务
        service = WorkSummaryService(
            openai_api_key=settings.OPENAI_API_KEY,
            es_client=es_client
        )
        
        # 分析工作内容
        result = await service.analyze_work_content(
            client_id=client_id,
            hours=hours
        )
        
        if not result.get("success", False):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "工作内容分析失败")
            )
        
        return result["data"]
        
    except Exception as e:
        logger.error(f"工作内容分析API错误: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"工作内容分析失败: {str(e)}"
        )

@router.get("/stats")
async def get_work_stats(
    client_id: str,
    hours: int = Query(4, ge=1, le=24),
    es_client: AsyncElasticsearch = Depends(get_es_client)
):
    """
    获取用户在指定时间范围内的工作统计数据
    
    Args:
        client_id: 客户端ID
        hours: 要分析的小时数，默认为4小时，最大24小时
        
    Returns:
        工作统计数据
    """
    try:
        # 创建工作内容总结服务
        service = WorkSummaryService(
            es_client=es_client
        )
        
        # 设置时间范围
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        # 获取工作数据
        work_data = await service.get_work_data(
            client_id=client_id,
            start_time=start_time,
            end_time=end_time
        )
        
        if not work_data:
            raise HTTPException(
                status_code=404,
                detail=f"未找到客户端 {client_id} 在过去{hours}小时内的工作数据"
            )
        
        # 返回统计数据
        return {
            "total_records": work_data["total_records"],
            "app_stats": work_data["app_stats"],
            "window_stats": work_data["window_stats"][:20],  # 只返回前20个最活跃的窗口
            "time_range": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"获取工作统计数据API错误: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"获取工作统计数据失败: {str(e)}"
        ) 
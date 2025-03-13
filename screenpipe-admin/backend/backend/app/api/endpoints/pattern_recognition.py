from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
import os
from datetime import datetime, timedelta

from elasticsearch import AsyncElasticsearch

from ...services.pattern_recognition_service import PatternRecognitionService
from ...core.config import settings
from ...db.elasticsearch import get_es_client

router = APIRouter()

@router.get("/analyze-from-db")
async def analyze_ocr_data_from_db(
    client_id: str,
    start_time: Optional[int] = None,
    end_time: Optional[int] = None,
    limit: int = Query(1000, description="最大记录数"),
    es_client: AsyncElasticsearch = Depends(get_es_client)
):
    """
    从数据库获取OCR数据并分析模式
    
    参数:
    - client_id: 客户端ID
    - start_time: 开始时间戳（可选，默认为4小时前）
    - end_time: 结束时间戳（可选，默认为当前时间）
    - limit: 最大记录数（默认1000）
    
    返回:
    - 识别出的模式和建议
    """
    # 设置OpenAI
    openai_api_key = settings.OPENAI_API_KEY
    if not openai_api_key:
        return {
            "error": "未配置OpenAI API密钥，无法进行模式识别",
            "setup_instructions": "请设置环境变量OPENAI_API_KEY"
        }
    
    # 设置默认时间范围（如果未提供）
    if not end_time:
        end_time_dt = datetime.utcnow()
    else:
        end_time_dt = datetime.fromtimestamp(end_time)
        
    if not start_time:
        # 默认分析最近4小时的数据
        start_time_dt = end_time_dt - timedelta(hours=4)
    else:
        start_time_dt = datetime.fromtimestamp(start_time)
    
    try:
        # 创建服务实例
        service = PatternRecognitionService(openai_api_key=openai_api_key, es_client=es_client)
        
        # 从ES获取数据并分析
        result = await service.analyze_client_data(
            client_id=client_id,
            start_time=start_time_dt,
            end_time=end_time_dt,
            limit=limit
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"模式识别分析失败: {str(e)}")

@router.get("/clients/{client_id}/patterns")
async def analyze_client_patterns(
    client_id: str,
    start_time: Optional[int] = None,
    end_time: Optional[int] = None,
    limit: int = Query(1000, description="最大记录数"),
    es_client: AsyncElasticsearch = Depends(get_es_client)
):
    """
    分析特定客户端的行为模式
    
    参数:
    - client_id: 客户端ID
    - start_time: 开始时间戳（可选，默认为4小时前）
    - end_time: 结束时间戳（可选，默认为当前时间）
    - limit: 最大记录数（默认1000）
    
    返回:
    - 识别出的模式和建议
    """
    # 设置OpenAI API密钥（在实际应用中应从环境变量或配置中获取）
    openai_api_key = os.environ.get("OPENAI_API_KEY", "")
    if not openai_api_key:
        return {
            "error": "未配置OpenAI API密钥，无法进行模式识别",
            "setup_instructions": "请设置环境变量OPENAI_API_KEY"
        }
    
    # 设置默认时间范围（如果未提供）
    if not end_time:
        end_time_dt = datetime.now()
    else:
        end_time_dt = datetime.fromtimestamp(end_time)
        
    if not start_time:
        # 默认分析最近4小时的数据
        start_time_dt = end_time_dt - timedelta(hours=4)
    else:
        start_time_dt = datetime.fromtimestamp(start_time)
    
    try:
        # 创建服务实例
        service = PatternRecognitionService(openai_api_key=openai_api_key, es_client=es_client)
        
        # 从ES获取数据并分析
        result = await service.analyze_client_data(
            client_id=client_id,
            start_time=start_time_dt,
            end_time=end_time_dt,
            limit=limit
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"模式识别分析失败: {str(e)}") 
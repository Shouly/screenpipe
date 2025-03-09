from datetime import date, datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.mysql import get_db
from ...models.api_models import (
    PluginUsageLogCreate, PluginUsageLogResponse, 
    PluginStatsResponse, PluginStatsSummary
)
from ...services.stats_service import StatsService

router = APIRouter()


# 客户端API端点
@router.post("/events", response_model=PluginUsageLogResponse, status_code=status.HTTP_201_CREATED)
async def log_plugin_event(
    log_data: PluginUsageLogCreate,
    db: AsyncSession = Depends(get_db)
):
    """记录插件事件"""
    return await StatsService.log_plugin_event(db, log_data)


@router.get("/user/{user_id}/events", response_model=List[PluginUsageLogResponse])
async def get_user_events(
    user_id: str = Path(..., title="用户ID"),
    plugin_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """获取用户的插件事件日志"""
    return await StatsService.get_user_plugin_events(db, user_id, plugin_id, skip, limit)


# 管理API端点
@router.get("/admin/plugins/{plugin_id}/stats", response_model=List[PluginStatsResponse])
async def get_plugin_stats(
    plugin_id: int = Path(..., title="插件ID"),
    start_date: date = Query(..., title="开始日期"),
    end_date: date = Query(..., title="结束日期"),
    db: AsyncSession = Depends(get_db)
):
    """获取插件在指定日期范围内的统计"""
    return await StatsService.get_plugin_stats(db, plugin_id, start_date, end_date)


@router.get("/admin/plugins/{plugin_id}/stats/summary", response_model=PluginStatsSummary)
async def get_plugin_stats_summary(
    plugin_id: int = Path(..., title="插件ID"),
    days: int = Query(30, title="天数", ge=1, le=365),
    db: AsyncSession = Depends(get_db)
):
    """获取插件统计摘要"""
    return await StatsService.get_plugin_stats_summary(db, plugin_id, days) 
from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.mysql import get_db
from ...models.api_models import (
    AppCategoryCreate,
    AppCategoryResponse,
    HourlyAppUsageSummary,
    PaginatedResponse,
    ProductivitySummary,
    ProductivityTypeEnum,
)
from ...services.app_usage_service import AppUsageService

router = APIRouter()


# 应用类别相关端点
@router.post("/categories", response_model=AppCategoryResponse)
async def create_app_category(
    category: AppCategoryCreate, db: AsyncSession = Depends(get_db)
):
    """创建新的应用类别"""
    service = AppUsageService(db)
    try:
        new_category = await service.create_app_category(
            name=category.name, productivity_type=category.productivity_type
        )
        return AppCategoryResponse(
            id=new_category.id,
            name=new_category.name,
            productivity_type=new_category.productivity_type,
            created_at=new_category.created_at,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"创建应用类别失败: {str(e)}")


@router.get("/categories", response_model=PaginatedResponse[AppCategoryResponse])
async def get_app_categories(
    skip: int = 0,
    limit: int = 100,
    productivity_type: Optional[ProductivityTypeEnum] = None,
    db: AsyncSession = Depends(get_db),
):
    """获取应用类别列表"""
    service = AppUsageService(db)
    try:
        categories, total = await service.get_app_categories(
            skip=skip, limit=limit, productivity_type=productivity_type
        )

        results = [
            AppCategoryResponse(
                id=cat.id,
                name=cat.name,
                productivity_type=cat.productivity_type,
                created_at=cat.created_at,
            )
            for cat in categories
        ]

        return PaginatedResponse[AppCategoryResponse](
            items=results, total=total, page=skip // limit + 1, size=limit
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"获取应用类别失败: {str(e)}")


@router.get("/categories/{category_id}", response_model=AppCategoryResponse)
async def get_app_category(category_id: int, db: AsyncSession = Depends(get_db)):
    """获取特定应用类别"""
    service = AppUsageService(db)
    try:
        category = await service.get_app_category_by_id(category_id)
        if not category:
            raise HTTPException(status_code=404, detail="应用类别不存在")

        return AppCategoryResponse(
            id=category.id,
            name=category.name,
            productivity_type=category.productivity_type,
            created_at=category.created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"获取应用类别失败: {str(e)}")


@router.put("/categories/{category_id}", response_model=AppCategoryResponse)
async def update_app_category(
    category_id: int, category: AppCategoryCreate, db: AsyncSession = Depends(get_db)
):
    """更新应用类别"""
    service = AppUsageService(db)
    try:
        updated_category = await service.update_app_category(
            category_id=category_id,
            name=category.name,
            productivity_type=category.productivity_type,
        )
        if not updated_category:
            raise HTTPException(status_code=404, detail="应用类别不存在")

        return AppCategoryResponse(
            id=updated_category.id,
            name=updated_category.name,
            productivity_type=updated_category.productivity_type,
            created_at=updated_category.created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"更新应用类别失败: {str(e)}")


@router.delete("/categories/{category_id}", response_model=dict)
async def delete_app_category(category_id: int, db: AsyncSession = Depends(get_db)):
    """删除应用类别"""
    service = AppUsageService(db)
    try:
        success = await service.delete_app_category(category_id)
        if not success:
            raise HTTPException(status_code=404, detail="应用类别不存在")

        return {"status": "success", "message": "应用类别已删除"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"删除应用类别失败: {str(e)}")


@router.get("/productivity-summary", response_model=ProductivitySummary)
async def get_productivity_summary(
    start_date: date = Query(..., description="开始日期"),
    end_date: date = Query(..., description="结束日期"),
    db: AsyncSession = Depends(get_db),
):
    """获取生产力统计摘要"""
    service = AppUsageService(db)
    try:
        # 获取当前日期范围的生产力数据
        productive_minutes, neutral_minutes, distracting_minutes = (
            await service.get_productivity_summary(
                start_date=start_date, end_date=end_date
            )
        )

        total_minutes = productive_minutes + neutral_minutes + distracting_minutes
        
        # 计算生产力百分比
        productive_percentage = (
            round(productive_minutes / total_minutes * 100, 2)
            if total_minutes > 0
            else 0
        )
        neutral_percentage = (
            round(neutral_minutes / total_minutes * 100, 2)
            if total_minutes > 0
            else 0
        )
        distracting_percentage = (
            round(distracting_minutes / total_minutes * 100, 2)
            if total_minutes > 0
            else 0
        )
        
        # 获取前一天的数据进行比较
        yesterday_start = start_date - timedelta(days=1)
        yesterday_end = end_date - timedelta(days=1)
        
        yesterday_productive_minutes, yesterday_neutral_minutes, yesterday_distracting_minutes = (
            await service.get_productivity_summary(
                start_date=yesterday_start, end_date=yesterday_end
            )
        )
        
        yesterday_total_minutes = yesterday_productive_minutes + yesterday_neutral_minutes + yesterday_distracting_minutes
        
        # 计算前一天的生产力百分比
        yesterday_productive_percentage = (
            round(yesterday_productive_minutes / yesterday_total_minutes * 100, 2)
            if yesterday_total_minutes > 0
            else 0
        )
        
        # 计算变化百分比
        total_minutes_change_percentage = (
            round((total_minutes - yesterday_total_minutes) / yesterday_total_minutes * 100, 2)
            if yesterday_total_minutes > 0
            else 0
        )
        
        # 计算效率指数变化（百分点）
        productive_percentage_change = round(productive_percentage - yesterday_productive_percentage, 2)
        
        # 获取最常用应用及其占比
        most_used_app_data = await service.get_most_used_app(start_date, end_date)
        most_used_app = most_used_app_data["app_name"] if most_used_app_data else None
        most_used_app_percentage = (
            round(most_used_app_data["total_minutes"] / total_minutes * 100, 2)
            if most_used_app_data and total_minutes > 0
            else 0
        )
        
        # 异常检测（简单实现）
        anomaly_count = 0
        anomaly_description = "一切正常"
        
        # 检查是否有异常情况
        if distracting_percentage > 30:
            anomaly_count += 1
            anomaly_description = "干扰型应用使用时间过长"
        elif total_minutes > 720:  # 12小时
            anomaly_count += 1
            anomaly_description = "使用时间过长，请注意休息"
        
        return ProductivitySummary(
            start_date=start_date,
            end_date=end_date,
            productive_minutes=productive_minutes,
            neutral_minutes=neutral_minutes,
            distracting_minutes=distracting_minutes,
            total_minutes=total_minutes,
            productive_percentage=productive_percentage,
            neutral_percentage=neutral_percentage,
            distracting_percentage=distracting_percentage,
            # 新增字段
            yesterday_total_minutes=yesterday_total_minutes,
            yesterday_productive_minutes=yesterday_productive_minutes,
            yesterday_neutral_minutes=yesterday_neutral_minutes,
            yesterday_distracting_minutes=yesterday_distracting_minutes,
            yesterday_productive_percentage=yesterday_productive_percentage,
            total_minutes_change_percentage=total_minutes_change_percentage,
            productive_percentage_change=productive_percentage_change,
            most_used_app=most_used_app,
            most_used_app_percentage=most_used_app_percentage,
            anomaly_count=anomaly_count,
            anomaly_description=anomaly_description,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"获取生产力统计摘要失败: {str(e)}")


@router.get("/daily-usage", response_model=List[dict])
async def get_daily_app_usage(
    start_date: date = Query(..., description="开始日期"),
    end_date: date = Query(..., description="结束日期"),
    db: AsyncSession = Depends(get_db),
):
    """获取每日应用使用时间统计"""
    service = AppUsageService(db)
    try:
        daily_usage = await service.get_daily_app_usage(
            start_date=start_date, end_date=end_date
        )

        return daily_usage
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"获取每日应用使用时间统计失败: {str(e)}"
        )


@router.get("/hourly-app-usage", response_model=List[HourlyAppUsageSummary])
async def get_hourly_app_usage(
    date: date = Query(..., description="日期"), db: AsyncSession = Depends(get_db)
):
    """获取按应用分组的每小时使用统计"""
    service = AppUsageService(db)
    try:
        hourly_app_usage = await service.get_hourly_app_usage_summary(date=date)
        return hourly_app_usage
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"获取按应用分组的每小时使用统计失败: {str(e)}"
        )

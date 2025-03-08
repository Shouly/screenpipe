import logging
from datetime import date, datetime, timedelta, time
from typing import Any, Dict, List, Optional, Tuple

from elasticsearch import AsyncElasticsearch
from sqlalchemy import and_, asc, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from ..core.config import settings
from ..models.app_usage import AppCategory, HourlyAppUsage, ProductivityType

logger = logging.getLogger(__name__)


class AppUsageService:
    def __init__(
        self, db: AsyncSession, es_client: Optional[AsyncElasticsearch] = None
    ):
        self.db = db
        self.es_client = es_client

    # 应用分类相关方法
    async def create_app_category(
        self, name: str, productivity_type: ProductivityType
    ) -> AppCategory:
        """创建新的应用类别"""
        # 检查是否已存在同名类别
        stmt = select(AppCategory).where(AppCategory.name == name)
        result = await self.db.execute(stmt)
        existing = result.scalars().first()

        if existing:
            return existing  # 如果已存在，直接返回现有类别，而不是抛出错误

        # 创建新类别
        new_category = AppCategory(name=name, productivity_type=productivity_type)

        self.db.add(new_category)
        await self.db.commit()
        await self.db.refresh(new_category)

        return new_category

    async def get_app_categories(
        self,
        skip: int = 0,
        limit: int = 100,
        productivity_type: Optional[ProductivityType] = None,
    ) -> Tuple[List[AppCategory], int]:
        """获取应用类别列表"""
        # 构建查询
        query = select(AppCategory)
        count_query = select(func.count()).select_from(AppCategory)

        # 添加筛选条件
        if productivity_type:
            query = query.where(AppCategory.productivity_type == productivity_type)
            count_query = count_query.where(
                AppCategory.productivity_type == productivity_type
            )

        # 添加排序和分页
        query = query.order_by(AppCategory.name).offset(skip).limit(limit)

        # 执行查询
        result = await self.db.execute(query)
        count_result = await self.db.execute(count_query)

        categories = result.scalars().all()
        total = count_result.scalar()

        return categories, total

    async def get_app_category_by_id(self, category_id: int) -> Optional[AppCategory]:
        """根据ID获取应用类别"""
        stmt = select(AppCategory).where(AppCategory.id == category_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def update_app_category(
        self, category_id: int, name: str, productivity_type: ProductivityType
    ) -> Optional[AppCategory]:
        """更新应用类别"""
        # 获取要更新的类别
        category = await self.get_app_category_by_id(category_id)
        if not category:
            return None

        # 检查是否存在同名类别（排除自身）
        if name != category.name:
            stmt = select(AppCategory).where(
                and_(AppCategory.name == name, AppCategory.id != category_id)
            )
            result = await self.db.execute(stmt)
            existing = result.scalars().first()

            if existing:
                raise ValueError(f"应用类别 '{name}' 已存在")

        # 更新类别
        category.name = name
        category.productivity_type = productivity_type

        await self.db.commit()
        await self.db.refresh(category)

        return category

    async def delete_app_category(self, category_id: int) -> bool:
        """删除应用类别"""
        # 获取要删除的类别
        category = await self.get_app_category_by_id(category_id)
        if not category:
            return False

        # 检查是否有关联的应用使用记录
        stmt = (
            select(func.count())
            .select_from(HourlyAppUsage)
            .where(HourlyAppUsage.app_category_id == category_id)
        )
        result = await self.db.execute(stmt)
        usage_count = result.scalar()

        if usage_count > 0:
            raise ValueError(f"无法删除类别，存在 {usage_count} 条关联的应用使用记录")

        # 删除类别
        await self.db.delete(category)
        await self.db.commit()

        return True

    # 小时应用使用统计相关方法
    def create_hourly_app_usage(self, data: Dict[str, Any]) -> HourlyAppUsage:
        """
        创建小时应用使用统计
        """
        db_usage = HourlyAppUsage(**data)
        self.db.add(db_usage)
        self.db.commit()
        self.db.refresh(db_usage)
        return db_usage

    def get_hourly_app_usage_by_id(self, usage_id: int) -> Optional[HourlyAppUsage]:
        """
        根据ID获取小时应用使用统计
        """
        return (
            self.db.query(HourlyAppUsage).filter(HourlyAppUsage.id == usage_id).first()
        )

    def get_hourly_app_usage_by_user_time_app(
        self, user_id: str, timestamp: datetime, app_name: str
    ) -> Optional[HourlyAppUsage]:
        """
        根据用户ID、时间戳和应用名称获取小时应用使用统计
        """
        return (
            self.db.query(HourlyAppUsage)
            .filter(
                HourlyAppUsage.user_id == user_id,
                HourlyAppUsage.timestamp == timestamp,
                HourlyAppUsage.app_name == app_name,
            )
            .first()
        )

    # 应用使用时间相关方法
    async def record_hourly_app_usage(
        self,
        app_name: str,
        category_id: int,
        usage_date: date,
        hour: int,
        duration_minutes: float,
        client_id: str = "default_user",
    ) -> HourlyAppUsage:
        """记录应用使用时间"""
        # 创建时间戳
        timestamp = datetime.combine(usage_date, time(hour=hour))
        
        # 计算星期几和是否是工作时间
        day_of_week = timestamp.weekday()
        is_working_hour = 9 <= hour < 18 and day_of_week < 5  # 工作日9点到18点
        
        # 转换为秒
        total_time_seconds = duration_minutes * 60

        # 检查是否已存在相同记录
        stmt = select(HourlyAppUsage).where(
            and_(
                HourlyAppUsage.app_name == app_name,
                HourlyAppUsage.app_category_id == category_id,
                HourlyAppUsage.timestamp == timestamp,
                HourlyAppUsage.hour_of_day == hour,
            )
        )
        result = await self.db.execute(stmt)
        existing = result.scalars().first()

        if existing:
            # 更新现有记录 - 累加而非覆盖
            existing.total_time_seconds += total_time_seconds
            # 更新最后修改时间
            existing.updated_at = datetime.utcnow()
            await self.db.commit()
            await self.db.refresh(existing)
            return existing

        # 创建新记录
        new_usage = HourlyAppUsage(
            user_id=client_id,
            app_name=app_name,
            app_category_id=category_id,
            timestamp=timestamp,  # 这里的timestamp已经是北京时间，因为它是从usage_date和hour构建的
            hour_of_day=hour,
            day_of_week=day_of_week,
            is_working_hour=is_working_hour,
            total_time_seconds=total_time_seconds,
        )

        self.db.add(new_usage)
        await self.db.commit()
        await self.db.refresh(new_usage)
        
        return new_usage

    async def batch_record_hourly_app_usage(
        self, usage_records: List[Dict[str, Any]]
    ) -> List[HourlyAppUsage]:
        """批量记录应用使用时间"""
        results = []

        for record in usage_records:
            try:
                usage = await self.record_hourly_app_usage(
                    app_name=record["app_name"],
                    category_id=record["category_id"],
                    usage_date=record["usage_date"],
                    hour=record["hour"],
                    duration_minutes=record["duration_minutes"],
                    client_id=record["client_id"],
                )
                results.append(usage)
            except Exception as e:
                # 记录错误但继续处理其他记录
                print(f"记录应用使用时间失败: {str(e)}")

        return results

    async def get_hourly_app_usage(
        self,
        start_date: date,
        end_date: date,
        app_name: Optional[str] = None,
        category_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[HourlyAppUsage], int]:
        """获取应用使用时间记录"""
        # 转换日期为datetime
        start_datetime = datetime.combine(start_date, time.min)
        end_datetime = datetime.combine(end_date, time.max)
        
        # 构建基本查询
        query = select(HourlyAppUsage).where(
            and_(
                HourlyAppUsage.timestamp >= start_datetime,
                HourlyAppUsage.timestamp <= end_datetime,
            )
        )

        count_query = (
            select(func.count())
            .select_from(HourlyAppUsage)
            .where(
                and_(
                    HourlyAppUsage.timestamp >= start_datetime,
                    HourlyAppUsage.timestamp <= end_datetime,
                )
            )
        )

        # 添加筛选条件
        if app_name:
            query = query.where(HourlyAppUsage.app_name == app_name)
            count_query = count_query.where(HourlyAppUsage.app_name == app_name)

        if category_id:
            query = query.where(HourlyAppUsage.app_category_id == category_id)
            count_query = count_query.where(HourlyAppUsage.app_category_id == category_id)

        # 添加排序和分页
        query = query.order_by(HourlyAppUsage.timestamp.desc()).offset(skip).limit(limit)

        # 执行查询
        result = await self.db.execute(query)
        count_result = await self.db.execute(count_query)

        usage_records = result.scalars().all()
        total = count_result.scalar()

        return usage_records, total

    async def get_productivity_summary(
        self, start_date: date, end_date: date
    ) -> Tuple[float, float, float]:
        """获取生产力统计摘要"""
        # 转换日期为datetime
        start_datetime = datetime.combine(start_date, time.min)
        end_datetime = datetime.combine(end_date, time.max)
        
        # 查询各生产力类型的总使用时间
        query = (
            select(
                AppCategory.productivity_type, func.sum(HourlyAppUsage.total_time_seconds / 60)
            )
            .join(AppCategory, HourlyAppUsage.app_category_id == AppCategory.id)
            .where(
                and_(
                    HourlyAppUsage.timestamp >= start_datetime,
                    HourlyAppUsage.timestamp <= end_datetime,
                )
            )
            .group_by(AppCategory.productivity_type)
        )

        result = await self.db.execute(query)

        # 初始化各类型时间
        productive_minutes = 0.0
        neutral_minutes = 0.0
        distracting_minutes = 0.0

        # 处理查询结果
        for row in result:
            productivity_type, minutes = row

            if productivity_type == ProductivityType.PRODUCTIVE:
                productive_minutes = minutes
            elif productivity_type == ProductivityType.NEUTRAL:
                neutral_minutes = minutes
            elif productivity_type == ProductivityType.DISTRACTING:
                distracting_minutes = minutes

        return productive_minutes, neutral_minutes, distracting_minutes

    async def get_daily_app_usage(
        self, start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        """获取每日应用使用时间统计"""
        # 转换日期为datetime
        start_datetime = datetime.combine(start_date, time.min)
        end_datetime = datetime.combine(end_date, time.max)
        
        # 查询每日应用使用时间
        query = (
            select(
                func.date(HourlyAppUsage.timestamp).label("usage_date"),
                HourlyAppUsage.app_name,
                HourlyAppUsage.app_category_id,
                AppCategory.name.label("category_name"),
                AppCategory.productivity_type,
                func.sum(HourlyAppUsage.total_time_seconds / 60).label("total_minutes"),
            )
            .join(AppCategory, HourlyAppUsage.app_category_id == AppCategory.id)
            .where(
                and_(
                    HourlyAppUsage.timestamp >= start_datetime,
                    HourlyAppUsage.timestamp <= end_datetime,
                )
            )
            .group_by(
                func.date(HourlyAppUsage.timestamp),
                HourlyAppUsage.app_name,
                HourlyAppUsage.app_category_id,
                AppCategory.name,
                AppCategory.productivity_type,
            )
            .order_by(func.date(HourlyAppUsage.timestamp), desc("total_minutes"))
        )

        result = await self.db.execute(query)

        # 处理查询结果
        daily_usage = []
        for row in result:
            daily_usage.append(
                {
                    "date": row.usage_date.isoformat(),
                    "app_name": row.app_name,
                    "category_id": row.app_category_id,
                    "category_name": row.category_name,
                    "productivity_type": row.productivity_type,
                    "total_minutes": row.total_minutes,
                }
            )

        return daily_usage


    async def get_hourly_app_usage_summary(self, date: date) -> List[Dict[str, Any]]:
        """获取按应用分组的每小时使用统计"""
        # 查询指定日期的应用使用记录，按应用名称和小时分组
        query = select(
            HourlyAppUsage.hour_of_day,
            HourlyAppUsage.app_name,
            AppCategory.productivity_type,
            func.sum(HourlyAppUsage.total_time_seconds / 60).label("duration_minutes")
        ).join(
            AppCategory, 
            HourlyAppUsage.app_category_id == AppCategory.id, 
            isouter=True
        ).where(
            func.date(HourlyAppUsage.timestamp) == date
        ).group_by(
            HourlyAppUsage.hour_of_day,
            HourlyAppUsage.app_name,
            AppCategory.productivity_type
        ).order_by(
            HourlyAppUsage.hour_of_day,
            func.sum(HourlyAppUsage.total_time_seconds).desc()
        )
        
        result = await self.db.execute(query)
        hourly_app_usage = result.fetchall()
        
        # 处理数据，转换为响应格式
        result_list = []
        for hour, app_name, productivity_type, duration in hourly_app_usage:
            hour_str = f"{hour:02d}:00"
            
            # 如果没有生产力类型，默认为中性
            if not productivity_type:
                productivity_type = ProductivityType.NEUTRAL
                
            result_list.append({
                "hour": hour_str,
                "app_name": app_name,
                "productivity_type": productivity_type,
                "duration_minutes": duration
            })
        
        return result_list
        
    async def get_most_used_app(self, start_date: date, end_date: date) -> Optional[Dict[str, Any]]:
        """获取指定日期范围内使用时间最长的应用"""
        # 转换日期为datetime
        start_datetime = datetime.combine(start_date, time.min)
        end_datetime = datetime.combine(end_date, time.max)
        
        # 查询使用时间最长的应用
        query = (
            select(
                HourlyAppUsage.app_name,
                func.sum(HourlyAppUsage.total_time_seconds / 60).label("total_minutes"),
            )
            .where(
                and_(
                    HourlyAppUsage.timestamp >= start_datetime,
                    HourlyAppUsage.timestamp <= end_datetime,
                )
            )
            .group_by(HourlyAppUsage.app_name)
            .order_by(desc("total_minutes"))
            .limit(1)
        )
        
        result = await self.db.execute(query)
        most_used_app = result.first()
        
        if most_used_app:
            return {
                "app_name": most_used_app.app_name,
                "total_minutes": most_used_app.total_minutes,
            }
        
        return None

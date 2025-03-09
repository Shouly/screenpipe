from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy import func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from ..models.plugin_stats import PluginStats, PluginUsageLog
from ..models.api_models import PluginUsageLogCreate, PluginStatsSummary, PluginEventType


class StatsService:
    @staticmethod
    async def log_plugin_event(
        db: AsyncSession, 
        log_data: PluginUsageLogCreate
    ) -> PluginUsageLog:
        """记录插件事件"""
        # 创建日志记录
        db_log = PluginUsageLog(
            plugin_id=log_data.plugin_id,
            user_id=log_data.user_id,
            machine_id=log_data.machine_id,
            event_type=log_data.event_type,
            version=log_data.version
        )
        
        db.add(db_log)
        await db.commit()
        await db.refresh(db_log)
        
        # 更新每日统计
        await StatsService.update_daily_stats(db, log_data.plugin_id, log_data.event_type)
        
        return db_log

    @staticmethod
    async def update_daily_stats(
        db: AsyncSession, 
        plugin_id: int, 
        event_type: PluginEventType
    ) -> None:
        """更新每日统计"""
        today = date.today()
        
        # 获取或创建今天的统计记录
        result = await db.execute(
            select(PluginStats).filter(
                PluginStats.plugin_id == plugin_id,
                PluginStats.date == today
            )
        )
        stats = result.scalars().first()
        
        if not stats:
            stats = PluginStats(
                plugin_id=plugin_id,
                date=today,
                active_installs=0,
                new_installs=0,
                uninstalls=0,
                updates=0,
                downloads=0
            )
            db.add(stats)
        
        # 根据事件类型更新统计
        if event_type == PluginEventType.INSTALL:
            stats.new_installs += 1
            stats.active_installs += 1
        elif event_type == PluginEventType.UNINSTALL:
            stats.uninstalls += 1
            stats.active_installs = max(0, stats.active_installs - 1)
        elif event_type == PluginEventType.UPDATE:
            stats.updates += 1
        elif event_type == PluginEventType.ACTIVATE:
            # 这里可以添加激活统计逻辑
            pass
        elif event_type == PluginEventType.DEACTIVATE:
            # 这里可以添加停用统计逻辑
            pass
        
        await db.commit()

    @staticmethod
    async def increment_download_count(
        db: AsyncSession, 
        plugin_id: int
    ) -> None:
        """增加下载计数"""
        today = date.today()
        
        # 获取或创建今天的统计记录
        result = await db.execute(
            select(PluginStats).filter(
                PluginStats.plugin_id == plugin_id,
                PluginStats.date == today
            )
        )
        stats = result.scalars().first()
        
        if not stats:
            stats = PluginStats(
                plugin_id=plugin_id,
                date=today,
                active_installs=0,
                new_installs=0,
                uninstalls=0,
                updates=0,
                downloads=1
            )
            db.add(stats)
        else:
            stats.downloads += 1
        
        await db.commit()

    @staticmethod
    async def get_plugin_stats(
        db: AsyncSession, 
        plugin_id: int, 
        start_date: date, 
        end_date: date
    ) -> List[PluginStats]:
        """获取插件在指定日期范围内的统计"""
        result = await db.execute(
            select(PluginStats).filter(
                PluginStats.plugin_id == plugin_id,
                PluginStats.date >= start_date,
                PluginStats.date <= end_date
            ).order_by(PluginStats.date)
        )
        return result.scalars().all()

    @staticmethod
    async def get_plugin_stats_summary(
        db: AsyncSession, 
        plugin_id: int, 
        days: int = 30
    ) -> PluginStatsSummary:
        """获取插件统计摘要"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # 获取指定日期范围内的统计
        stats_list = await StatsService.get_plugin_stats(db, plugin_id, start_date, end_date)
        
        # 计算总安装量
        total_installs_query = select(func.sum(PluginStats.new_installs)).filter(
            PluginStats.plugin_id == plugin_id
        )
        total_installs_result = await db.execute(total_installs_query)
        total_installs = total_installs_result.scalar() or 0
        
        # 计算活跃安装量（总安装量减去总卸载量）
        total_uninstalls_query = select(func.sum(PluginStats.uninstalls)).filter(
            PluginStats.plugin_id == plugin_id
        )
        total_uninstalls_result = await db.execute(total_uninstalls_query)
        total_uninstalls = total_uninstalls_result.scalar() or 0
        
        active_installs = max(0, total_installs - total_uninstalls)
        
        # 计算总下载量
        total_downloads_query = select(func.sum(PluginStats.downloads)).filter(
            PluginStats.plugin_id == plugin_id
        )
        total_downloads_result = await db.execute(total_downloads_query)
        total_downloads = total_downloads_result.scalar() or 0
        
        # 计算平均每日安装量
        if days > 0:
            # 获取指定日期范围内的总安装量
            period_installs_query = select(func.sum(PluginStats.new_installs)).filter(
                PluginStats.plugin_id == plugin_id,
                PluginStats.date >= start_date,
                PluginStats.date <= end_date
            )
            period_installs_result = await db.execute(period_installs_query)
            period_installs = period_installs_result.scalar() or 0
            
            average_daily_installs = period_installs / days
        else:
            average_daily_installs = 0
        
        # 构建安装趋势数据
        install_trend = []
        for stat in stats_list:
            install_trend.append({
                "date": stat.date.isoformat(),
                "installs": stat.new_installs,
                "uninstalls": stat.uninstalls,
                "updates": stat.updates,
                "downloads": stat.downloads
            })
        
        return PluginStatsSummary(
            total_installs=total_installs,
            active_installs=active_installs,
            total_downloads=total_downloads,
            average_daily_installs=average_daily_installs,
            install_trend=install_trend
        )

    @staticmethod
    async def get_user_plugin_events(
        db: AsyncSession, 
        user_id: str, 
        plugin_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[PluginUsageLog]:
        """获取用户的插件事件日志"""
        query = select(PluginUsageLog).filter(PluginUsageLog.user_id == user_id)
        
        if plugin_id:
            query = query.filter(PluginUsageLog.plugin_id == plugin_id)
            
        query = query.order_by(desc(PluginUsageLog.created_at)).offset(skip).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all() 
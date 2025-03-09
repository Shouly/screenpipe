from typing import Dict, List, Optional
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from ..models.plugin_review import PluginReview
from ..models.api_models import ReviewCreate, ReviewUpdate, ReviewSummary
from ..services.license_service import LicenseService


class ReviewService:
    @staticmethod
    async def create_review(
        db: AsyncSession, 
        user_id: str, 
        review_data: ReviewCreate
    ) -> PluginReview:
        """创建新的评论"""
        # 检查用户是否已经评论过该插件
        existing_review = await ReviewService.get_user_review_for_plugin(
            db, user_id, review_data.plugin_id
        )
        
        if existing_review:
            # 如果已经评论过，则更新评论
            for key, value in review_data.dict().items():
                if key != "plugin_id":  # 不更新plugin_id
                    setattr(existing_review, key, value)
            
            await db.commit()
            await db.refresh(existing_review)
            return existing_review
        
        # 检查是否是已验证购买
        is_verified = await LicenseService.check_user_has_license(
            db, user_id, review_data.plugin_id
        )
        
        # 创建新评论
        db_review = PluginReview(
            plugin_id=review_data.plugin_id,
            user_id=user_id,
            rating=review_data.rating,
            title=review_data.title,
            comment=review_data.comment,
            is_verified_purchase=is_verified
        )
        
        db.add(db_review)
        await db.commit()
        await db.refresh(db_review)
        
        # 更新插件的平均评分（可以在这里实现，或者使用数据库触发器）
        
        return db_review

    @staticmethod
    async def get_review(db: AsyncSession, review_id: int) -> Optional[PluginReview]:
        """根据ID获取评论"""
        result = await db.execute(select(PluginReview).filter(PluginReview.id == review_id))
        return result.scalars().first()

    @staticmethod
    async def get_user_review_for_plugin(
        db: AsyncSession, 
        user_id: str, 
        plugin_id: int
    ) -> Optional[PluginReview]:
        """获取用户对特定插件的评论"""
        result = await db.execute(
            select(PluginReview).filter(
                PluginReview.user_id == user_id,
                PluginReview.plugin_id == plugin_id
            )
        )
        return result.scalars().first()

    @staticmethod
    async def get_plugin_reviews(
        db: AsyncSession, 
        plugin_id: int, 
        skip: int = 0, 
        limit: int = 100,
        verified_only: bool = False
    ) -> List[PluginReview]:
        """获取插件的所有评论"""
        query = select(PluginReview).filter(PluginReview.plugin_id == plugin_id)
        
        if verified_only:
            query = query.filter(PluginReview.is_verified_purchase == True)
            
        query = query.order_by(PluginReview.created_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def update_review(
        db: AsyncSession, 
        review_id: int, 
        user_id: str,
        review_update: ReviewUpdate
    ) -> Optional[PluginReview]:
        """更新评论"""
        db_review = await ReviewService.get_review(db, review_id)
        
        if not db_review or db_review.user_id != user_id:
            return None
        
        # 更新字段
        update_data = review_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_review, key, value)
        
        await db.commit()
        await db.refresh(db_review)
        
        # 更新插件的平均评分（可以在这里实现，或者使用数据库触发器）
        
        return db_review

    @staticmethod
    async def delete_review(db: AsyncSession, review_id: int, user_id: str) -> bool:
        """删除评论"""
        db_review = await ReviewService.get_review(db, review_id)
        
        if not db_review or db_review.user_id != user_id:
            return False
        
        await db.delete(db_review)
        await db.commit()
        
        # 更新插件的平均评分（可以在这里实现，或者使用数据库触发器）
        
        return True

    @staticmethod
    async def get_review_summary(db: AsyncSession, plugin_id: int) -> ReviewSummary:
        """获取插件的评论摘要"""
        # 获取平均评分
        avg_query = select(func.avg(PluginReview.rating)).filter(PluginReview.plugin_id == plugin_id)
        avg_result = await db.execute(avg_query)
        average_rating = avg_result.scalar() or 0.0
        
        # 获取评论总数
        count_query = select(func.count()).filter(PluginReview.plugin_id == plugin_id)
        count_result = await db.execute(count_query)
        total_reviews = count_result.scalar() or 0
        
        # 获取评分分布
        distribution = {}
        for rating in range(1, 6):
            rating_query = select(func.count()).filter(
                PluginReview.plugin_id == plugin_id,
                PluginReview.rating == rating
            )
            rating_result = await db.execute(rating_query)
            distribution[rating] = rating_result.scalar() or 0
        
        return ReviewSummary(
            average_rating=float(average_rating),
            total_reviews=total_reviews,
            rating_distribution=distribution
        ) 
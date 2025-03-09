from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.mysql import get_db
from ...models.api_models import (
    ReviewCreate, ReviewResponse, ReviewUpdate, ReviewSummary
)
from ...services.review_service import ReviewService

router = APIRouter()


# 客户端API端点
@router.post("/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: ReviewCreate,
    user_id: str,  # 在实际应用中，这应该从认证中获取
    db: AsyncSession = Depends(get_db)
):
    """创建新评论"""
    return await ReviewService.create_review(db, user_id, review_data)


@router.get("/plugins/{plugin_id}/reviews", response_model=List[ReviewResponse])
async def get_plugin_reviews(
    plugin_id: int = Path(..., title="插件ID"),
    skip: int = 0,
    limit: int = 100,
    verified_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """获取插件的评论列表"""
    return await ReviewService.get_plugin_reviews(db, plugin_id, skip, limit, verified_only)


@router.get("/plugins/{plugin_id}/reviews/summary", response_model=ReviewSummary)
async def get_plugin_review_summary(
    plugin_id: int = Path(..., title="插件ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取插件的评论摘要"""
    return await ReviewService.get_review_summary(db, plugin_id)


@router.get("/reviews/{review_id}", response_model=ReviewResponse)
async def get_review(
    review_id: int = Path(..., title="评论ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取评论详情"""
    db_review = await ReviewService.get_review(db, review_id)
    if db_review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    return db_review


@router.put("/reviews/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_update: ReviewUpdate,
    review_id: int = Path(..., title="评论ID"),
    user_id: str = Query(..., title="用户ID"),  # 在实际应用中，这应该从认证中获取
    db: AsyncSession = Depends(get_db)
):
    """更新评论"""
    db_review = await ReviewService.update_review(db, review_id, user_id, review_update)
    if not db_review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found or you don't have permission to update it"
        )
    return db_review


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int = Path(..., title="评论ID"),
    user_id: str = Query(..., title="用户ID"),  # 在实际应用中，这应该从认证中获取
    db: AsyncSession = Depends(get_db)
):
    """删除评论"""
    result = await ReviewService.delete_review(db, review_id, user_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found or you don't have permission to delete it"
        )
    return None


# 管理API端点
@router.get("/admin/reviews", response_model=List[ReviewResponse])
async def get_all_reviews(
    plugin_id: Optional[int] = None,
    user_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """获取所有评论（管理员用）"""
    if plugin_id:
        return await ReviewService.get_plugin_reviews(db, plugin_id, skip, limit)
    # 这里可以添加更多的查询逻辑，例如按用户ID查询
    # 为简化示例，这里只实现了按插件ID查询
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Please provide plugin_id"
    )


@router.delete("/admin/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_review(
    review_id: int = Path(..., title="评论ID"),
    db: AsyncSession = Depends(get_db)
):
    """管理员删除评论"""
    db_review = await ReviewService.get_review(db, review_id)
    if not db_review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    await db.delete(db_review)
    await db.commit()
    return None 
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ....db.mysql import get_db
from ....models.api_models import (
    ReviewCreate, ReviewResponse, ReviewUpdate, ReviewSummary
)
from ....services.review_service import ReviewService

router = APIRouter()


# 客户端API端点
@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: ReviewCreate,
    user_id: str,  # 在实际应用中，这应该从认证中获取
    db: AsyncSession = Depends(get_db)
):
    """创建新评论"""
    return await ReviewService.create_review(db, review_data, user_id)


@router.get("/plugin/{plugin_id}", response_model=List[ReviewResponse])
async def get_plugin_reviews(
    plugin_id: int = Path(..., title="插件ID"),
    skip: int = 0,
    limit: int = 100,
    verified_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """获取插件评论列表"""
    return await ReviewService.get_plugin_reviews(db, plugin_id, skip, limit, verified_only)


@router.get("/plugin/{plugin_id}/summary", response_model=ReviewSummary)
async def get_plugin_review_summary(
    plugin_id: int = Path(..., title="插件ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取插件评论摘要"""
    return await ReviewService.get_plugin_review_summary(db, plugin_id)


@router.get("/{review_id}", response_model=ReviewResponse)
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


@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_update: ReviewUpdate,
    review_id: int = Path(..., title="评论ID"),
    user_id: str = Query(..., title="用户ID"),  # 在实际应用中，这应该从认证中获取
    db: AsyncSession = Depends(get_db)
):
    """更新评论"""
    # 检查评论是否存在
    db_review = await ReviewService.get_review(db, review_id)
    if not db_review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    # 检查用户是否有权限更新此评论
    if db_review.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this review"
        )
    
    return await ReviewService.update_review(db, review_id, review_update)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int = Path(..., title="评论ID"),
    user_id: str = Query(..., title="用户ID"),  # 在实际应用中，这应该从认证中获取
    db: AsyncSession = Depends(get_db)
):
    """删除评论"""
    # 检查评论是否存在
    db_review = await ReviewService.get_review(db, review_id)
    if not db_review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    # 检查用户是否有权限删除此评论
    if db_review.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this review"
        )
    
    result = await ReviewService.delete_review(db, review_id)
    return None


# 管理API端点
@router.get("/admin", response_model=List[ReviewResponse])
async def get_all_reviews(
    plugin_id: Optional[int] = None,
    user_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """获取所有评论（管理员用）"""
    if plugin_id:
        return await ReviewService.get_plugin_reviews(db, plugin_id, skip, limit, verified_only=False)
    elif user_id:
        return await ReviewService.get_user_reviews(db, user_id, skip, limit)
    else:
        return await ReviewService.get_all_reviews(db, skip, limit)


@router.delete("/admin/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_review(
    review_id: int = Path(..., title="评论ID"),
    db: AsyncSession = Depends(get_db)
):
    """管理员删除评论"""
    result = await ReviewService.delete_review(db, review_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    return None 
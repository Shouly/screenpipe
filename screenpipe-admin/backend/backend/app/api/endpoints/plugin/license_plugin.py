from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ....db.mysql import get_db
from ....models.api_models import (
    LicenseCreate, LicenseResponse, LicenseUpdate,
    LicenseVerificationRequest, LicenseVerificationResponse
)
from ....services.license_service import LicenseService

router = APIRouter()


# 管理API端点
@router.post("/", response_model=LicenseResponse, status_code=status.HTTP_201_CREATED)
async def create_license(
    license_data: LicenseCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建新许可证"""
    return await LicenseService.create_license(db, license_data)


@router.get("/", response_model=List[LicenseResponse])
async def get_licenses(
    user_id: Optional[str] = None,
    plugin_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """获取许可证列表"""
    if user_id:
        return await LicenseService.get_user_licenses(db, user_id, skip, limit)
    elif plugin_id:
        return await LicenseService.get_plugin_licenses(db, plugin_id, skip, limit)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either user_id or plugin_id must be provided"
        )


@router.get("/{license_id}", response_model=LicenseResponse)
async def get_license(
    license_id: int = Path(..., title="许可证ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取许可证详情"""
    db_license = await LicenseService.get_license(db, license_id)
    if db_license is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="License not found"
        )
    return db_license


@router.put("/{license_id}", response_model=LicenseResponse)
async def update_license(
    license_update: LicenseUpdate,
    license_id: int = Path(..., title="许可证ID"),
    db: AsyncSession = Depends(get_db)
):
    """更新许可证信息"""
    db_license = await LicenseService.update_license(db, license_id, license_update)
    if not db_license:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="License not found"
        )
    return db_license


@router.delete("/{license_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_license(
    license_id: int = Path(..., title="许可证ID"),
    db: AsyncSession = Depends(get_db)
):
    """撤销许可证"""
    result = await LicenseService.revoke_license(db, license_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="License not found"
        )
    return None


# 客户端API端点
@router.post("/verify", response_model=LicenseVerificationResponse)
async def verify_license(
    verification_request: LicenseVerificationRequest,
    db: AsyncSession = Depends(get_db)
):
    """验证许可证"""
    result = await LicenseService.verify_license(
        db,
        verification_request.license_key,
        verification_request.plugin_id,
        verification_request.user_id
    )
    return {
        "valid": result,
        "message": "License is valid" if result else "License is invalid or expired"
    }


@router.get("/user/{user_id}/has-license/{plugin_id}")
async def check_user_has_license(
    user_id: str = Path(..., title="用户ID"),
    plugin_id: int = Path(..., title="插件ID"),
    db: AsyncSession = Depends(get_db)
):
    """检查用户是否拥有插件许可证"""
    has_license = await LicenseService.check_user_has_license(db, user_id, plugin_id)
    return {"has_license": has_license} 
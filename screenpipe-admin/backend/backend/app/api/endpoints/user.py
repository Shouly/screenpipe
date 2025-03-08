from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from ...db.mysql import get_db
from ...models.api_models import (
    LoginRequest, 
    LoginResponse, 
    UserInDB, 
    UserDeviceInDB,
    UserDeviceCreate,
    UserDeviceUpdate
)
from ...services.user_service import UserService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    用户登录或注册接口
    
    如果用户不存在，将自动创建新用户
    """
    try:
        # 获取客户端IP
        client_ip = request.client.host if request.client else None
        
        # 登录或注册用户
        user, is_new_user = await UserService.login_or_register(
            db=db,
            token=login_data.token,
            email=login_data.email,
            name=login_data.name,
            device_info=login_data.device_info,
            ip_address=client_ip
        )
        
        # 构建响应
        message = "注册成功" if is_new_user else "登录成功"
        return LoginResponse(
            user=user,
            message=message
        )
    except Exception as e:
        logger.error(f"登录失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败: {str(e)}"
        )

@router.get("/me", response_model=UserInDB)
async def get_current_user(
    request: Request,
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """获取当前用户信息"""
    user = await UserService.get_user_by_token(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌"
        )
    return user

@router.get("/devices", response_model=List[UserDeviceInDB])
async def get_user_devices(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """获取用户的所有设备"""
    user = await UserService.get_user_by_token(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌"
        )
    
    devices = await UserService.get_user_devices(db, user.id)
    return devices

@router.post("/devices", response_model=UserDeviceInDB)
async def add_device(
    request: Request,
    token: str,
    device_data: UserDeviceCreate,
    db: AsyncSession = Depends(get_db)
):
    """添加新设备"""
    user = await UserService.get_user_by_token(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌"
        )
    
    # 获取客户端IP
    client_ip = request.client.host if request.client else None
    
    # 登录或注册用户，添加新设备
    updated_user, _ = await UserService.login_or_register(
        db=db,
        token=token,
        device_info=device_data,
        ip_address=client_ip
    )
    
    # 获取新添加的设备（当前设备）
    devices = await UserService.get_user_devices(db, updated_user.id)
    current_device = next((d for d in devices if d.is_current), None)
    
    if not current_device:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="添加设备失败"
        )
    
    return current_device

@router.put("/devices/{device_id}", response_model=UserDeviceInDB)
async def update_device(
    device_id: str,
    token: str,
    device_data: UserDeviceUpdate,
    db: AsyncSession = Depends(get_db)
):
    """更新设备信息"""
    user = await UserService.get_user_by_token(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌"
        )
    
    # 检查设备是否属于该用户
    devices = await UserService.get_user_devices(db, user.id)
    if not any(d.id == device_id for d in devices):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权操作此设备"
        )
    
    updated_device = await UserService.update_device(db, device_id, device_data)
    if not updated_device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="设备不存在"
        )
    
    return updated_device

@router.delete("/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    device_id: str,
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """删除设备"""
    user = await UserService.get_user_by_token(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌"
        )
    
    # 检查设备是否属于该用户
    devices = await UserService.get_user_devices(db, user.id)
    device = next((d for d in devices if d.id == device_id), None)
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="设备不存在"
        )
    
    # 不允许删除当前设备
    if device.is_current:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除当前使用的设备"
        )
    
    success = await UserService.delete_device(db, device_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="删除设备失败"
        )

@router.post("/devices/{device_id}/set-current", response_model=UserDeviceInDB)
async def set_current_device(
    device_id: str,
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """设置当前设备"""
    user = await UserService.get_user_by_token(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌"
        )
    
    # 检查设备是否属于该用户
    devices = await UserService.get_user_devices(db, user.id)
    device = next((d for d in devices if d.id == device_id), None)
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="设备不存在"
        )
    
    success = await UserService.set_current_device(db, user.id, device_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="设置当前设备失败"
        )
    
    # 获取更新后的设备
    updated_devices = await UserService.get_user_devices(db, user.id)
    current_device = next((d for d in updated_devices if d.id == device_id), None)
    
    return current_device 
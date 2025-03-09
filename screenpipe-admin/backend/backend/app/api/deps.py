from typing import Optional
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
import jwt
from jwt.exceptions import PyJWTError

from ..db.mysql import get_db
from ..core.config import settings
from ..models.api_models import UserInDB

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> Optional[UserInDB]:
    """
    验证用户令牌并返回当前用户
    如果令牌无效或过期，则抛出401异常
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # 解码JWT令牌
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET, 
            algorithms=["HS256"]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 从数据库获取用户信息
        # 注意：这里假设您有一个用户模型和相应的服务
        # 如果您的用户模型和服务不同，请相应调整
        from ..services.user_service import UserService
        user = await UserService.get_user_by_id(db, user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
    
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> Optional[UserInDB]:
    """
    尝试验证用户令牌并返回当前用户
    如果没有令牌或令牌无效，则返回None
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # 解码JWT令牌
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET, 
            algorithms=["HS256"]
        )
        user_id = payload.get("sub")
        if user_id is None:
            return None
        
        # 从数据库获取用户信息
        from ..services.user_service import UserService
        user = await UserService.get_user_by_id(db, user_id)
        return user
    
    except PyJWTError:
        return None

def get_current_user_id(
    current_user: UserInDB = Depends(get_current_user)
) -> str:
    """
    返回当前用户的ID
    """
    return current_user.id 
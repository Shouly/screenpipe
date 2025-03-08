from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
import logging
import secrets
import time
from datetime import datetime, timedelta

# 导入PyJWT库
import jwt

from pydantic import EmailStr

from ...db.mysql import get_db
from ...models.api_models import (
    EmailLoginRequest, 
    OAuthLoginRequest,
    LoginResponse, 
    TokenResponse,
    UserInDB, 
    UserUpdate
)
from ...services.user_service import UserService
from ...services.email_service import EmailService
from ...core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# JWT相关配置
JWT_SECRET = settings.JWT_SECRET
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION = 60 * 24 * 30  # 30天过期

def create_jwt_token(user_id: str, email: str) -> str:
    """创建JWT令牌"""
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION),
        "iat": datetime.utcnow()
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    if isinstance(token, bytes):
        return token.decode('utf-8')
    return token

def verify_jwt_token(token: str) -> dict:
    """验证JWT令牌"""
    try:
        # 确保使用正确的JWT解码方法
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT令牌已过期")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="认证令牌已过期"
        )
    except jwt.InvalidTokenError as e:
        logger.warning(f"无效的JWT令牌: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌"
        )
    except Exception as e:
        logger.error(f"验证JWT令牌时发生错误: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="认证失败"
        )

@router.post("/login/email", response_model=TokenResponse)
async def email_login(
    request: Request,
    login_data: EmailLoginRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    邮箱登录接口
    
    发送一次性登录链接到邮箱
    """
    try:
        # 获取客户端IP
        client_ip = request.client.host if request.client else None
        
        # 创建登录码
        login_code = await UserService.create_login_code(db, login_data.email)
        
        # 发送登录链接到邮箱
        login_url = f"{settings.FRONTEND_URL}/login/verify?code={login_code}&email={login_data.email}"
        background_tasks.add_task(
            EmailService.send_login_email,
            login_data.email,
            login_url
        )
        
        return TokenResponse(
            success=True,
            message="登录链接已发送到您的邮箱",
            requires_verification=True
        )
    except Exception as e:
        logger.error(f"邮箱登录失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败: {str(e)}"
        )

@router.post("/login/verify", response_model=LoginResponse)
async def verify_email_login(
    request: Request,
    email: EmailStr,
    code: str,
    db: AsyncSession = Depends(get_db)
):
    """验证邮箱登录链接"""
    try:
        # 获取客户端IP
        client_ip = request.client.host if request.client else None
        
        # 验证登录码
        try:
            is_valid = await UserService.verify_login_code(db, email, code)
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="无效或已过期的登录链接"
                )
        except Exception as e:
            logger.error(f"验证登录码失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="验证登录链接时出错"
            )
        
        # 登录或注册用户
        try:
            user, is_new_user = await UserService.login_or_register_by_email(
                db=db,
                email=email,
                device_info=None,  # 设备信息在前端收集
                ip_address=client_ip
            )
        except Exception as e:
            logger.error(f"登录或注册用户失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="登录或注册用户时出错"
            )
        
        # 创建JWT令牌
        try:
            access_token = create_jwt_token(user.id, user.email)
            logger.info(f"成功创建JWT令牌: user_id={user.id}")
        except Exception as e:
            logger.error(f"创建JWT令牌失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="创建认证令牌失败"
            )
        
        # 构建响应
        message = "注册成功" if is_new_user else "登录成功"
        return LoginResponse(
            user=user,
            access_token=access_token,
            message=message
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"验证邮箱登录失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败: {str(e)}"
        )

@router.post("/login/oauth", response_model=LoginResponse)
async def oauth_login(
    request: Request,
    login_data: OAuthLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    OAuth登录接口
    
    支持Google、GitHub等第三方登录
    """
    try:
        # 获取客户端IP
        client_ip = request.client.host if request.client else None
        
        # 验证OAuth令牌
        try:
            oauth_info = await UserService.verify_oauth_token(
                provider=login_data.provider,
                token=login_data.token
            )
            
            if not oauth_info:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="无效的OAuth令牌"
                )
        except Exception as e:
            logger.error(f"验证OAuth令牌失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"验证OAuth令牌失败: {str(e)}"
            )
        
        # 登录或注册用户
        try:
            user, is_new_user = await UserService.login_or_register_by_oauth(
                db=db,
                provider=login_data.provider,
                oauth_id=oauth_info["id"],
                email=oauth_info["email"],
                name=oauth_info["name"],
                avatar=oauth_info.get("avatar"),
                device_info=login_data.device_info,
                ip_address=client_ip
            )
        except Exception as e:
            logger.error(f"OAuth登录或注册用户失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"OAuth登录或注册用户失败: {str(e)}"
            )
        
        # 创建JWT令牌
        try:
            access_token = create_jwt_token(user.id, user.email)
            logger.info(f"成功创建OAuth用户JWT令牌: user_id={user.id}")
        except Exception as e:
            logger.error(f"创建OAuth用户JWT令牌失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="创建认证令牌失败"
            )
        
        # 构建响应
        message = "注册成功" if is_new_user else "登录成功"
        return LoginResponse(
            user=user,
            access_token=access_token,
            message=message
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth登录失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败: {str(e)}"
        )

@router.get("/me", response_model=UserInDB)
async def get_current_user(
    request: Request,
    token: str = Depends(lambda x: x.headers.get("Authorization").split("Bearer ")[1] if x.headers.get("Authorization") else None),
    db: AsyncSession = Depends(get_db)
):
    """获取当前用户信息"""
    try:
        # 验证JWT令牌
        payload = verify_jwt_token(token)
        user_id = payload["sub"]
        
        # 获取用户信息
        user = await UserService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取用户信息失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取用户信息失败: {str(e)}"
        )

@router.put("/me", response_model=UserInDB)
async def update_current_user(
    request: Request,
    user_data: UserUpdate,
    token: str = Depends(lambda x: x.headers.get("Authorization").split("Bearer ")[1] if x.headers.get("Authorization") else None),
    db: AsyncSession = Depends(get_db)
):
    """更新当前用户信息"""
    try:
        # 验证JWT令牌
        payload = verify_jwt_token(token)
        user_id = payload["sub"]
        
        # 更新用户信息
        updated_user = await UserService.update_user(db, user_id, user_data)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新用户信息失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新用户信息失败: {str(e)}"
        ) 
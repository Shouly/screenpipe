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
    UserUpdate,
    DeviceInfo
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
    发送邮箱登录验证码
    """
    try:
        # 获取客户端IP
        client_ip = request.client.host if request.client else None
        
        # 创建登录码
        code = await UserService.create_login_code(db, login_data.email)
        
        # 发送邮件（异步）
        background_tasks.add_task(
            EmailService.send_login_code,
            login_data.email,
            code
        )
        
        # 记录设备信息（如果提供）
        device_info = login_data.device_info
        
        logger.info(f"已发送登录验证码: email={login_data.email}, ip={client_ip}")
        
        return TokenResponse(
            success=True,
            message="验证码已发送到您的邮箱，请查收",
            requires_verification=True
        )
    except Exception as e:
        logger.error(f"发送登录验证码失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"发送登录验证码失败: {str(e)}"
        )

@router.post("/login/verify", response_model=LoginResponse)
async def verify_email_login(
    request: Request,
    verify_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    验证邮箱登录码
    """
    try:
        # 获取客户端IP
        client_ip = request.client.host if request.client else None
        
        # 从请求体中获取邮箱和验证码
        email = verify_data.get("email")
        code = verify_data.get("code")
        
        if not email or not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="缺少必要参数：email和code"
            )
        
        # 验证登录码
        is_valid = await UserService.verify_login_code(db, email, code)
        
        if not is_valid:
            logger.warning(f"登录验证码无效: email={email}, ip={client_ip}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="验证码无效或已过期"
            )
        
        # 尝试提取设备信息
        device_info = None
        try:
            user_agent = request.headers.get("user-agent", "")
            if user_agent:
                # 简单解析User-Agent
                is_mobile = "Mobile" in user_agent
                is_tablet = "Tablet" in user_agent or "iPad" in user_agent
                
                if is_mobile:
                    device_type = "mobile"
                elif is_tablet:
                    device_type = "tablet"
                else:
                    device_type = "desktop"
                
                # 检测操作系统
                os_name = "unknown"
                os_version = None
                
                if "Windows" in user_agent:
                    os_name = "Windows"
                    if "Windows NT 10.0" in user_agent:
                        os_version = "10"
                    elif "Windows NT 6.3" in user_agent:
                        os_version = "8.1"
                    elif "Windows NT 6.2" in user_agent:
                        os_version = "8"
                    elif "Windows NT 6.1" in user_agent:
                        os_version = "7"
                elif "Mac OS X" in user_agent:
                    os_name = "macOS"
                    import re
                    mac_version = re.search(r"Mac OS X (\d+[._]\d+[._]?\d*)", user_agent)
                    if mac_version:
                        os_version = mac_version.group(1).replace("_", ".")
                elif "Android" in user_agent:
                    os_name = "Android"
                    import re
                    android_version = re.search(r"Android (\d+[._]\d+[._]?\d*)", user_agent)
                    if android_version:
                        os_version = android_version.group(1)
                elif "iOS" in user_agent or "iPhone OS" in user_agent:
                    os_name = "iOS"
                    import re
                    ios_version = re.search(r"OS (\d+[._]\d+[._]?\d*)", user_agent)
                    if ios_version:
                        os_version = ios_version.group(1).replace("_", ".")
                elif "Linux" in user_agent:
                    os_name = "Linux"
                
                # 检测浏览器
                browser_name = "unknown"
                browser_version = None
                
                if "Chrome" in user_agent and "Chromium" not in user_agent:
                    browser_name = "Chrome"
                    import re
                    chrome_version = re.search(r"Chrome/(\d+\.\d+\.\d+\.\d+)", user_agent)
                    if chrome_version:
                        browser_version = chrome_version.group(1)
                elif "Firefox" in user_agent:
                    browser_name = "Firefox"
                    import re
                    firefox_version = re.search(r"Firefox/(\d+\.\d+)", user_agent)
                    if firefox_version:
                        browser_version = firefox_version.group(1)
                elif "Safari" in user_agent and "Chrome" not in user_agent:
                    browser_name = "Safari"
                    import re
                    safari_version = re.search(r"Version/(\d+\.\d+\.\d+)", user_agent)
                    if safari_version:
                        browser_version = safari_version.group(1)
                elif "Edge" in user_agent:
                    browser_name = "Edge"
                    import re
                    edge_version = re.search(r"Edge/(\d+\.\d+\.\d+\.\d+)", user_agent)
                    if edge_version:
                        browser_version = edge_version.group(1)
                
                device_info = DeviceInfo(
                    name=f"{os_name} {browser_name}",
                    device_type=device_type,
                    os=os_name,
                    os_version=os_version,
                    browser=browser_name,
                    browser_version=browser_version,
                    ip_address=client_ip
                )
        except Exception as e:
            logger.warning(f"解析设备信息失败: {str(e)}")
            # 设备信息解析失败不影响登录流程
        
        # 登录或注册用户
        user, is_new_user = await UserService.login_or_register_by_email(
            db, 
            email, 
            device_info=device_info,
            ip_address=client_ip
        )
        
        # 创建JWT令牌
        access_token = create_jwt_token(user.id, user.email)
        
        # 返回用户信息和令牌
        return LoginResponse(
            user=user,
            access_token=access_token,
            message="登录成功" if not is_new_user else "注册成功"
        )
    except HTTPException:
        # 直接重新抛出HTTP异常
        raise
    except Exception as e:
        logger.error(f"验证登录码失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"验证登录失败: {str(e)}"
        )

@router.post("/login/oauth", response_model=LoginResponse)
async def oauth_login(
    request: Request,
    login_data: OAuthLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    OAuth登录
    """
    try:
        # 获取客户端IP
        client_ip = request.client.host if request.client else None
        
        # 验证OAuth令牌
        user_info = await UserService.verify_oauth_token(login_data.provider, login_data.token)
        
        if not user_info:
            logger.warning(f"OAuth令牌验证失败: provider={login_data.provider}, ip={client_ip}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的OAuth令牌"
            )
        
        # 提取用户信息
        oauth_id = user_info.get("id")
        email = user_info.get("email")
        name = user_info.get("name")
        avatar = user_info.get("picture")
        
        if not oauth_id or not email:
            logger.warning(f"OAuth令牌缺少必要信息: provider={login_data.provider}, ip={client_ip}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OAuth令牌缺少必要的用户信息"
            )
        
        # 设备信息
        device_info = login_data.device_info
        
        # 如果没有提供设备信息，尝试从User-Agent解析
        if not device_info:
            try:
                user_agent = request.headers.get("user-agent", "")
                if user_agent:
                    # 简单解析User-Agent
                    from ..models.api_models import DeviceInfo
                    
                    is_mobile = "Mobile" in user_agent
                    is_tablet = "Tablet" in user_agent or "iPad" in user_agent
                    
                    if is_mobile:
                        device_type = "mobile"
                    elif is_tablet:
                        device_type = "tablet"
                    else:
                        device_type = "desktop"
                    
                    # 检测操作系统
                    os_name = "unknown"
                    os_version = None
                    
                    if "Windows" in user_agent:
                        os_name = "Windows"
                        if "Windows NT 10.0" in user_agent:
                            os_version = "10"
                        elif "Windows NT 6.3" in user_agent:
                            os_version = "8.1"
                        elif "Windows NT 6.2" in user_agent:
                            os_version = "8"
                        elif "Windows NT 6.1" in user_agent:
                            os_version = "7"
                    elif "Mac OS X" in user_agent:
                        os_name = "macOS"
                        import re
                        mac_version = re.search(r"Mac OS X (\d+[._]\d+[._]?\d*)", user_agent)
                        if mac_version:
                            os_version = mac_version.group(1).replace("_", ".")
                    elif "Android" in user_agent:
                        os_name = "Android"
                        import re
                        android_version = re.search(r"Android (\d+[._]\d+[._]?\d*)", user_agent)
                        if android_version:
                            os_version = android_version.group(1)
                    elif "iOS" in user_agent or "iPhone OS" in user_agent:
                        os_name = "iOS"
                        import re
                        ios_version = re.search(r"OS (\d+[._]\d+[._]?\d*)", user_agent)
                        if ios_version:
                            os_version = ios_version.group(1).replace("_", ".")
                    elif "Linux" in user_agent:
                        os_name = "Linux"
                    
                    # 检测浏览器
                    browser_name = "unknown"
                    browser_version = None
                    
                    if "Chrome" in user_agent and "Chromium" not in user_agent:
                        browser_name = "Chrome"
                        import re
                        chrome_version = re.search(r"Chrome/(\d+\.\d+\.\d+\.\d+)", user_agent)
                        if chrome_version:
                            browser_version = chrome_version.group(1)
                    elif "Firefox" in user_agent:
                        browser_name = "Firefox"
                        import re
                        firefox_version = re.search(r"Firefox/(\d+\.\d+)", user_agent)
                        if firefox_version:
                            browser_version = firefox_version.group(1)
                    elif "Safari" in user_agent and "Chrome" not in user_agent:
                        browser_name = "Safari"
                        import re
                        safari_version = re.search(r"Version/(\d+\.\d+\.\d+)", user_agent)
                        if safari_version:
                            browser_version = safari_version.group(1)
                    elif "Edge" in user_agent:
                        browser_name = "Edge"
                        import re
                        edge_version = re.search(r"Edge/(\d+\.\d+\.\d+\.\d+)", user_agent)
                        if edge_version:
                            browser_version = edge_version.group(1)
                    
                    device_info = DeviceInfo(
                        name=f"{os_name} {browser_name}",
                        device_type=device_type,
                        os=os_name,
                        os_version=os_version,
                        browser=browser_name,
                        browser_version=browser_version,
                        ip_address=client_ip
                    )
            except Exception as e:
                logger.warning(f"解析设备信息失败: {str(e)}")
                # 设备信息解析失败不影响登录流程
        
        # 登录或注册用户
        user, is_new_user = await UserService.login_or_register_by_oauth(
            db,
            login_data.provider,
            oauth_id,
            email,
            name or email.split('@')[0],
            avatar,
            device_info=device_info,
            ip_address=client_ip
        )
        
        # 创建JWT令牌
        access_token = create_jwt_token(user.id, user.email)
        
        # 返回用户信息和令牌
        return LoginResponse(
            user=user,
            access_token=access_token,
            message="登录成功" if not is_new_user else "注册成功"
        )
    except HTTPException:
        # 直接重新抛出HTTP异常
        raise
    except Exception as e:
        logger.error(f"OAuth登录失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth登录失败: {str(e)}"
        )

@router.get("/me", response_model=UserInDB)
async def get_current_user(
    request: Request,
    token: str = Depends(lambda x: x.headers.get("Authorization").split("Bearer ")[1] if x.headers.get("Authorization") else None),
    db: AsyncSession = Depends(get_db)
):
    """
    获取当前登录用户信息
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证令牌"
        )
    
    try:
        # 验证JWT令牌
        payload = verify_jwt_token(token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的认证令牌"
            )
        
        # 获取用户信息
        user = await UserService.get_user_by_id(db, user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="认证令牌已过期"
        )
    except (jwt.InvalidTokenError, Exception) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"无效的认证令牌: {str(e)}"
        )

@router.put("/me", response_model=UserInDB)
async def update_current_user(
    request: Request,
    user_data: UserUpdate,
    token: str = Depends(lambda x: x.headers.get("Authorization").split("Bearer ")[1] if x.headers.get("Authorization") else None),
    db: AsyncSession = Depends(get_db)
):
    """
    更新当前登录用户信息
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证令牌"
        )
    
    try:
        # 验证JWT令牌
        payload = verify_jwt_token(token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的认证令牌"
            )
        
        # 更新用户信息
        updated_user = await UserService.update_user(db, user_id, user_data)
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        return updated_user
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="认证令牌已过期"
        )
    except (jwt.InvalidTokenError, Exception) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"无效的认证令牌: {str(e)}"
        ) 
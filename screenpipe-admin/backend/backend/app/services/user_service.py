from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from datetime import datetime, timedelta
import logging
import uuid
import httpx
import json
import random
import string

from ..models.user import User, LoginCode
from ..models.api_models import UserUpdate, DeviceInfo
from ..core.config import settings

logger = logging.getLogger(__name__)

class UserService:
    """用户服务类，处理用户相关的业务逻辑"""
    
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """通过email获取用户"""
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        return result.scalars().first()
    
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        """通过ID获取用户"""
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        return result.scalars().first()
    
    @staticmethod
    async def get_user_by_oauth(db: AsyncSession, provider: str, oauth_id: str) -> Optional[User]:
        """通过OAuth信息获取用户"""
        stmt = select(User).where(
            User.oauth_provider == provider,
            User.oauth_id == oauth_id
        )
        result = await db.execute(stmt)
        return result.scalars().first()
    
    @staticmethod
    async def update_user(db: AsyncSession, user_id: str, user_data: UserUpdate) -> Optional[User]:
        """更新用户信息"""
        user = await UserService.get_user_by_id(db, user_id)
        if not user:
            return None
        
        update_data = user_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(user, key, value)
        
        user.updated_at = datetime.now()
        await db.commit()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def create_login_code(db: AsyncSession, email: str) -> str:
        """创建登录码"""
        # 生成6位纯数字验证码
        code = ''.join(random.choices(string.digits, k=6))
        
        # 设置过期时间（10分钟）
        expires_at = datetime.now() + timedelta(minutes=10)
        
        # 创建登录码记录
        login_code = LoginCode(
            email=email,
            code=code,
            expires_at=expires_at,
            used=False
        )
        
        # 删除该邮箱的旧登录码
        await db.execute(delete(LoginCode).where(LoginCode.email == email))
        
        # 保存新登录码
        db.add(login_code)
        await db.commit()
        
        return code
    
    @staticmethod
    async def verify_login_code(db: AsyncSession, email: str, code: str) -> bool:
        """验证登录码"""
        try:
            # 查询登录码
            logger.info(f"尝试验证登录码: email={email}, code={code}")
            
            result = await db.execute(
                select(LoginCode).where(
                    LoginCode.email == email,
                    LoginCode.code == code,
                    LoginCode.used == False,
                    LoginCode.expires_at > datetime.now()
                )
            )
            login_code = result.scalars().first()
            
            if not login_code:
                logger.warning(f"登录码验证失败: email={email}, code={code}")
                return False
            
            # 标记为已使用
            login_code.used = True
            await db.commit()
            logger.info(f"登录码验证成功: email={email}")
            
            return True
        except Exception as e:
            logger.error(f"验证登录码时发生错误: {str(e)}")
            # 确保在异常情况下也能正确关闭会话
            try:
                await db.rollback()
            except:
                pass
            raise
    
    @staticmethod
    async def verify_oauth_token(provider: str, token: str) -> Optional[Dict[str, Any]]:
        """验证OAuth令牌"""
        try:
            if provider == "google":
                # 验证Google令牌
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={token}"
                    )
                    if response.status_code != 200:
                        return None
                    
                    data = response.json()
                    return {
                        "id": data["sub"],
                        "email": data["email"],
                        "name": data.get("name", data["email"].split("@")[0]),
                        "avatar": data.get("picture")
                    }
            
            elif provider == "github":
                # 验证GitHub令牌
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        "https://api.github.com/user",
                        headers={"Authorization": f"token {token}"}
                    )
                    if response.status_code != 200:
                        return None
                    
                    user_data = response.json()
                    
                    # 获取邮箱（GitHub可能不会直接返回邮箱）
                    email_response = await client.get(
                        "https://api.github.com/user/emails",
                        headers={"Authorization": f"token {token}"}
                    )
                    
                    email = None
                    if email_response.status_code == 200:
                        emails = email_response.json()
                        primary_email = next((e for e in emails if e.get("primary")), None)
                        email = primary_email["email"] if primary_email else emails[0]["email"]
                    
                    return {
                        "id": str(user_data["id"]),
                        "email": email or f"{user_data['login']}@github.com",
                        "name": user_data.get("name") or user_data["login"],
                        "avatar": user_data.get("avatar_url")
                    }
            
            # 如果是开发环境，允许模拟OAuth登录
            elif provider == "mock" and settings.DEBUG:
                # 解析模拟数据
                try:
                    mock_data = json.loads(token)
                    return {
                        "id": mock_data.get("id", str(uuid.uuid4())),
                        "email": mock_data.get("email", "mock@example.com"),
                        "name": mock_data.get("name", "Mock User"),
                        "avatar": mock_data.get("avatar")
                    }
                except:
                    # 如果解析失败，返回默认模拟数据
                    return {
                        "id": f"mock-{uuid.uuid4()}",
                        "email": "mock@example.com",
                        "name": "Mock User",
                        "avatar": None
                    }
            
            return None
        except Exception as e:
            logger.error(f"验证OAuth令牌失败: {str(e)}")
            return None
    
    @staticmethod
    async def login_or_register_by_email(
        db: AsyncSession, 
        email: str,
        device_info: Optional[DeviceInfo] = None,
        ip_address: Optional[str] = None
    ) -> Tuple[User, bool]:
        """通过邮箱登录或注册用户"""
        try:
            # 查找用户
            user = await UserService.get_user_by_email(db, email)
            is_new_user = False
            
            # 如果用户不存在，则创建新用户
            if not user:
                user = User(
                    id=str(uuid.uuid4()),
                    email=email,
                    name=email.split('@')[0],  # 使用邮箱前缀作为默认名称
                    last_login_at=datetime.now(),
                    last_login_ip=ip_address
                )
                db.add(user)
                is_new_user = True
                logger.info(f"创建新用户: {email}")
            else:
                # 更新登录信息
                user.last_login_at = datetime.now()
                user.last_login_ip = ip_address
                logger.info(f"用户登录: {email}")
            
            # 更新设备信息
            if device_info:
                await UserService._update_device_info(user, device_info, ip_address)
            
            await db.commit()
            await db.refresh(user)
            
            logger.info(f"邮箱用户登录或注册成功: email={email}, is_new_user={is_new_user}")
            return user, is_new_user
        except Exception as e:
            logger.error(f"邮箱登录或注册用户失败: {str(e)}")
            # 不需要显式回滚，因为我们使用了 async with db.begin()
            raise
    
    @staticmethod
    async def login_or_register_by_oauth(
        db: AsyncSession, 
        provider: str,
        oauth_id: str,
        email: str,
        name: str,
        avatar: Optional[str] = None,
        device_info: Optional[DeviceInfo] = None,
        ip_address: Optional[str] = None
    ) -> Tuple[User, bool]:
        """通过OAuth登录或注册用户"""
        try:
            # 先通过OAuth信息查找用户
            user = await UserService.get_user_by_oauth(db, provider, oauth_id)
            is_new_user = False
            
            if not user:
                # 再通过邮箱查找用户
                user = await UserService.get_user_by_email(db, email)
                
                if not user:
                    # 如果用户不存在，则创建新用户
                    user = User(
                        id=str(uuid.uuid4()),
                        email=email,
                        name=name,
                        avatar=avatar,
                        oauth_provider=provider,
                        oauth_id=oauth_id,
                        last_login_at=datetime.now(),
                        last_login_ip=ip_address
                    )
                    db.add(user)
                    is_new_user = True
                    logger.info(f"创建新OAuth用户: provider={provider}, email={email}")
                else:
                    # 如果用户存在但没有关联OAuth，则更新OAuth信息
                    user.oauth_provider = provider
                    user.oauth_id = oauth_id
                    user.name = name
                    user.avatar = avatar or user.avatar
                    user.last_login_at = datetime.now()
                    user.last_login_ip = ip_address
                    logger.info(f"更新用户OAuth信息: provider={provider}, email={email}")
            else:
                # 更新用户信息
                user.name = name
                user.avatar = avatar or user.avatar
                user.last_login_at = datetime.now()
                user.last_login_ip = ip_address
                logger.info(f"OAuth用户登录: provider={provider}, email={email}")
            
            # 更新设备信息
            if device_info:
                await UserService._update_device_info(user, device_info, ip_address)
            
            await db.commit()
            await db.refresh(user)
            
            logger.info(f"OAuth用户登录或注册成功: provider={provider}, oauth_id={oauth_id}, is_new_user={is_new_user}")
            return user, is_new_user
        except Exception as e:
            logger.error(f"OAuth登录或注册用户失败: {str(e)}")
            # 不需要显式回滚，因为我们使用了 async with db.begin()
            raise
    
    @staticmethod
    async def _update_device_info(
        user: User,
        device_info: DeviceInfo,
        ip_address: Optional[str] = None
    ) -> None:
        """更新用户设备信息（内部方法）"""
        user.device_name = device_info.name
        user.device_type = device_info.device_type
        user.device_os = device_info.os
        user.device_os_version = device_info.os_version
        user.device_browser = device_info.browser
        user.device_browser_version = device_info.browser_version
        user.last_login_ip = ip_address or device_info.ip_address or user.last_login_ip
        user.device_last_active_at = datetime.now() 
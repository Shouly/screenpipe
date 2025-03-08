from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from datetime import datetime, timedelta
import logging
import uuid
import httpx
import json

from ..models.user import User, UserDevice, LoginCode
from ..models.api_models import UserUpdate, UserDeviceBase
from ..core.config import settings

logger = logging.getLogger(__name__)

class UserService:
    """用户服务类，处理用户相关的业务逻辑"""
    
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """通过email获取用户"""
        result = await db.execute(select(User).where(User.email == email))
        return result.scalars().first()
    
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        """通过ID获取用户"""
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()
    
    @staticmethod
    async def get_user_by_oauth(db: AsyncSession, provider: str, oauth_id: str) -> Optional[User]:
        """通过OAuth信息获取用户"""
        result = await db.execute(
            select(User).where(
                User.oauth_provider == provider,
                User.oauth_id == oauth_id
            )
        )
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
        # 生成随机登录码
        code = str(uuid.uuid4())
        
        # 设置过期时间（1小时后）
        expires_at = datetime.now() + timedelta(hours=1)
        
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
        device_info: Optional[UserDeviceBase] = None,
        ip_address: Optional[str] = None
    ) -> Tuple[User, bool]:
        """通过邮箱登录或注册用户"""
        try:
            logger.info(f"尝试通过邮箱登录或注册用户: email={email}")
            
            # 尝试通过邮箱查找用户
            user = await UserService.get_user_by_email(db, email)
            is_new_user = False
            
            if user:
                # 用户存在，更新登录信息
                logger.info(f"用户已存在，更新登录信息: email={email}")
                user.last_login_at = datetime.now()
                user.last_login_ip = ip_address
                user.updated_at = datetime.now()
            else:
                # 用户不存在，创建新用户
                logger.info(f"用户不存在，创建新用户: email={email}")
                user = User(
                    id=str(uuid.uuid4()),
                    email=email,
                    name=email.split('@')[0],  # 使用邮箱前缀作为默认名称
                    last_login_at=datetime.now(),
                    last_login_ip=ip_address,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.add(user)
                is_new_user = True
            
            # 添加设备信息（如果提供）
            if device_info and user.id:
                try:
                    await UserService._add_device(db, user.id, device_info, ip_address)
                except Exception as e:
                    logger.error(f"添加设备信息失败: {str(e)}")
                    # 设备信息添加失败不影响用户登录
            
            await db.commit()
            if user.id:
                await db.refresh(user)
            
            logger.info(f"用户登录或注册成功: email={email}, is_new_user={is_new_user}")
            return user, is_new_user
        except Exception as e:
            logger.error(f"登录或注册用户失败: {str(e)}")
            try:
                await db.rollback()
            except:
                pass
            raise
    
    @staticmethod
    async def login_or_register_by_oauth(
        db: AsyncSession, 
        provider: str,
        oauth_id: str,
        email: str,
        name: str,
        avatar: Optional[str] = None,
        device_info: Optional[UserDeviceBase] = None,
        ip_address: Optional[str] = None
    ) -> Tuple[User, bool]:
        """通过OAuth登录或注册用户"""
        # 先尝试通过OAuth信息查找用户
        user = await UserService.get_user_by_oauth(db, provider, oauth_id)
        
        # 如果没找到，再尝试通过邮箱查找
        if not user:
            user = await UserService.get_user_by_email(db, email)
            
        is_new_user = False
        
        if user:
            # 用户存在，更新登录信息
            user.last_login_at = datetime.now()
            user.last_login_ip = ip_address
            
            # 如果是通过邮箱找到的用户，更新OAuth信息
            if not user.oauth_provider or not user.oauth_id:
                user.oauth_provider = provider
                user.oauth_id = oauth_id
            
            # 如果提供了新的名称或头像，更新用户信息
            if name and name != user.name:
                user.name = name
            if avatar and avatar != user.avatar:
                user.avatar = avatar
                
            user.updated_at = datetime.now()
        else:
            # 用户不存在，创建新用户
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                name=name,
                avatar=avatar,
                oauth_provider=provider,
                oauth_id=oauth_id,
                last_login_at=datetime.now(),
                last_login_ip=ip_address,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(user)
            is_new_user = True
        
        # 添加设备信息（如果提供）
        if device_info and user.id:
            await UserService._add_device(db, user.id, device_info, ip_address)
        
        await db.commit()
        if user.id:
            await db.refresh(user)
        
        return user, is_new_user
    
    @staticmethod
    async def _add_device(
        db: AsyncSession,
        user_id: str,
        device_info: UserDeviceBase,
        ip_address: Optional[str] = None
    ) -> None:
        """添加设备信息（内部方法）"""
        # 先将该用户的所有设备设为非当前设备
        await db.execute(
            update(UserDevice)
            .where(UserDevice.user_id == user_id)
            .values(is_current=False)
        )
        
        # 检查是否已存在相同特征的设备
        device_query = (
            select(UserDevice)
            .where(
                UserDevice.user_id == user_id,
                UserDevice.device_type == device_info.device_type,
                UserDevice.os == device_info.os
            )
        )
        if device_info.browser:
            device_query = device_query.where(UserDevice.browser == device_info.browser)
            
        existing_device = await db.execute(device_query)
        existing_device = existing_device.scalars().first()
        
        if existing_device:
            # 更新现有设备
            existing_device.name = device_info.name
            existing_device.os_version = device_info.os_version
            existing_device.browser_version = device_info.browser_version
            existing_device.ip_address = ip_address or device_info.ip_address
            existing_device.last_active_at = datetime.now()
            existing_device.is_current = True
        else:
            # 创建新设备
            new_device = UserDevice(
                id=str(uuid.uuid4()),
                user_id=user_id,
                name=device_info.name,
                device_type=device_info.device_type,
                os=device_info.os,
                os_version=device_info.os_version,
                browser=device_info.browser,
                browser_version=device_info.browser_version,
                ip_address=ip_address or device_info.ip_address,
                last_active_at=datetime.now(),
                is_current=True
            )
            db.add(new_device) 
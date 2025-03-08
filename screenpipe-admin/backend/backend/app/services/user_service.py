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
        from sqlalchemy.orm import selectinload
        stmt = select(User).options(selectinload(User.devices)).where(User.email == email)
        result = await db.execute(stmt)
        return result.scalars().first()
    
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        """通过ID获取用户"""
        from sqlalchemy.orm import selectinload
        stmt = select(User).options(selectinload(User.devices)).where(User.id == user_id)
        result = await db.execute(stmt)
        return result.scalars().first()
    
    @staticmethod
    async def get_user_by_oauth(db: AsyncSession, provider: str, oauth_id: str) -> Optional[User]:
        """通过OAuth信息获取用户"""
        from sqlalchemy.orm import selectinload
        stmt = select(User).options(selectinload(User.devices)).where(
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
            is_new_user = False
            
            # 使用事务包装所有操作，确保原子性
            async with db.begin():
                # 尝试通过邮箱查找用户
                user = await UserService.get_user_by_email(db, email)
                
                if user:
                    # 用户存在，更新登录信息
                    logger.info(f"用户已存在，更新登录信息: email={email}")
                    user.last_login_at = datetime.now()
                    user.last_login_ip = ip_address
                    user.updated_at = datetime.now()
                else:
                    # 用户不存在，尝试创建新用户
                    try:
                        logger.info(f"用户不存在，尝试创建新用户: email={email}")
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
                    except Exception as e:
                        # 如果创建失败，可能是并发请求已经创建了用户
                        if "Duplicate entry" in str(e) and "idx_users_email" in str(e):
                            logger.warning(f"创建用户时发生唯一键冲突，尝试重新查询: email={email}")
                            # 重新查询用户
                            user = await UserService.get_user_by_email(db, email)
                            if not user:
                                logger.error(f"唯一键冲突后仍然找不到用户: email={email}")
                                raise Exception(f"数据库一致性错误: 邮箱 {email} 已存在但无法查询到")
                            
                            # 更新登录信息
                            user.last_login_at = datetime.now()
                            user.last_login_ip = ip_address
                            user.updated_at = datetime.now()
                        else:
                            # 其他错误，直接抛出
                            raise
                
                # 添加设备信息（如果提供）
                if device_info and user.id:
                    try:
                        await UserService._add_device(db, user.id, device_info, ip_address)
                    except Exception as e:
                        logger.error(f"添加设备信息失败: {str(e)}")
                        # 设备信息添加失败不影响用户登录
            
            # 事务已提交，现在重新加载用户及其设备
            try:
                # 使用新的会话查询用户，确保看到最新数据
                from sqlalchemy.orm import selectinload
                stmt = select(User).options(selectinload(User.devices)).where(User.email == email)
                result = await db.execute(stmt)
                loaded_user = result.scalars().first()
                
                if not loaded_user:
                    logger.error(f"无法加载用户及其设备: email={email}")
                    # 这种情况不应该发生，因为我们刚刚创建或更新了用户
                    raise Exception(f"数据库一致性错误: 无法加载刚刚创建/更新的用户 {email}")
                
                user = loaded_user
            except Exception as e:
                logger.error(f"加载用户设备失败: {str(e)}")
                # 尝试不带设备关系重新加载用户
                stmt = select(User).where(User.email == email)
                result = await db.execute(stmt)
                user = result.scalars().first()
                if not user:
                    raise Exception(f"无法加载用户: {str(e)}")
            
            logger.info(f"用户登录或注册成功: email={email}, is_new_user={is_new_user}")
            return user, is_new_user
        except Exception as e:
            logger.error(f"登录或注册用户失败: {str(e)}")
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
        device_info: Optional[UserDeviceBase] = None,
        ip_address: Optional[str] = None
    ) -> Tuple[User, bool]:
        """通过OAuth登录或注册用户"""
        try:
            logger.info(f"尝试通过OAuth登录或注册用户: provider={provider}, oauth_id={oauth_id}, email={email}")
            is_new_user = False
            
            # 使用事务包装所有操作，确保原子性
            async with db.begin():
                # 尝试通过OAuth信息查找用户
                user = await UserService.get_user_by_oauth(db, provider, oauth_id)
                
                if user:
                    # 用户存在，更新登录信息
                    logger.info(f"OAuth用户已存在，更新登录信息: provider={provider}, oauth_id={oauth_id}")
                    user.last_login_at = datetime.now()
                    user.last_login_ip = ip_address
                    user.updated_at = datetime.now()
                    
                    # 更新用户信息（如果有变化）
                    if user.name != name:
                        user.name = name
                    if avatar and user.avatar != avatar:
                        user.avatar = avatar
                else:
                    # 尝试通过邮箱查找用户
                    user = await UserService.get_user_by_email(db, email)
                    
                    if user:
                        # 用户存在但未关联OAuth，更新OAuth信息
                        logger.info(f"用户已存在但未关联OAuth，更新OAuth信息: email={email}, provider={provider}")
                        user.oauth_provider = provider
                        user.oauth_id = oauth_id
                        user.last_login_at = datetime.now()
                        user.last_login_ip = ip_address
                        user.updated_at = datetime.now()
                        
                        # 更新用户信息（如果有变化）
                        if user.name != name:
                            user.name = name
                        if avatar and user.avatar != avatar:
                            user.avatar = avatar
                    else:
                        # 用户不存在，尝试创建新用户
                        try:
                            logger.info(f"用户不存在，尝试创建新OAuth用户: provider={provider}, oauth_id={oauth_id}, email={email}")
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
                        except Exception as e:
                            # 如果创建失败，可能是并发请求已经创建了用户
                            if "Duplicate entry" in str(e) and "idx_users_email" in str(e):
                                logger.warning(f"创建OAuth用户时发生唯一键冲突，尝试重新查询: email={email}")
                                # 重新查询用户
                                user = await UserService.get_user_by_email(db, email)
                                if not user:
                                    logger.error(f"唯一键冲突后仍然找不到用户: email={email}")
                                    raise Exception(f"数据库一致性错误: 邮箱 {email} 已存在但无法查询到")
                                
                                # 更新OAuth信息
                                user.oauth_provider = provider
                                user.oauth_id = oauth_id
                                user.last_login_at = datetime.now()
                                user.last_login_ip = ip_address
                                user.updated_at = datetime.now()
                                
                                # 更新用户信息（如果有变化）
                                if user.name != name:
                                    user.name = name
                                if avatar and user.avatar != avatar:
                                    user.avatar = avatar
                            else:
                                # 其他错误，直接抛出
                                raise
                
                # 添加设备信息（如果提供）
                if device_info and user.id:
                    try:
                        await UserService._add_device(db, user.id, device_info, ip_address)
                    except Exception as e:
                        logger.error(f"添加设备信息失败: {str(e)}")
                        # 设备信息添加失败不影响用户登录
            
            # 事务已提交，现在重新加载用户及其设备
            try:
                # 使用新的会话查询用户，确保看到最新数据
                from sqlalchemy.orm import selectinload
                stmt = select(User).options(selectinload(User.devices)).where(
                    (User.email == email) & 
                    ((User.oauth_provider == provider) | (User.oauth_provider == None))
                )
                result = await db.execute(stmt)
                loaded_user = result.scalars().first()
                
                if not loaded_user:
                    logger.error(f"无法加载OAuth用户及其设备: email={email}, provider={provider}")
                    # 尝试只通过邮箱查询
                    stmt = select(User).options(selectinload(User.devices)).where(User.email == email)
                    result = await db.execute(stmt)
                    loaded_user = result.scalars().first()
                    
                    if not loaded_user:
                        # 这种情况不应该发生，因为我们刚刚创建或更新了用户
                        raise Exception(f"数据库一致性错误: 无法加载刚刚创建/更新的OAuth用户 {email}")
                
                user = loaded_user
            except Exception as e:
                logger.error(f"加载OAuth用户设备失败: {str(e)}")
                # 尝试不带设备关系重新加载用户
                stmt = select(User).where(User.email == email)
                result = await db.execute(stmt)
                user = result.scalars().first()
                if not user:
                    raise Exception(f"无法加载OAuth用户: {str(e)}")
            
            logger.info(f"OAuth用户登录或注册成功: provider={provider}, oauth_id={oauth_id}, is_new_user={is_new_user}")
            return user, is_new_user
        except Exception as e:
            logger.error(f"OAuth登录或注册用户失败: {str(e)}")
            # 不需要显式回滚，因为我们使用了 async with db.begin()
            raise
    
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
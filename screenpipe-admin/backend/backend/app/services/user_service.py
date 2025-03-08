from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from datetime import datetime
import logging
import uuid

from ..models.user import User, UserDevice
from ..models.api_models import UserCreate, UserUpdate, UserDeviceCreate, UserDeviceUpdate

logger = logging.getLogger(__name__)

class UserService:
    """用户服务类，处理用户相关的业务逻辑"""
    
    @staticmethod
    async def get_user_by_token(db: AsyncSession, token: str) -> Optional[User]:
        """通过token获取用户"""
        result = await db.execute(select(User).where(User.token == token))
        return result.scalars().first()
    
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
    async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
        """创建新用户"""
        user = User(
            id=str(uuid.uuid4()),
            email=user_data.email,
            name=user_data.name,
            avatar=user_data.avatar,
            token=user_data.token,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
    
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
    async def login_or_register(
        db: AsyncSession, 
        token: str, 
        email: Optional[str] = None,
        name: Optional[str] = None,
        device_info: Optional[UserDeviceCreate] = None,
        ip_address: Optional[str] = None
    ) -> Tuple[User, bool]:
        """登录或注册用户（如果不存在）"""
        # 尝试通过token查找用户
        user = await UserService.get_user_by_token(db, token)
        is_new_user = False
        
        if user:
            # 用户存在，更新登录信息
            user.last_login_at = datetime.now()
            user.last_login_ip = ip_address
            
            # 如果提供了新的email或name，更新用户信息
            if email and email != user.email:
                user.email = email
            if name and name != user.name:
                user.name = name
                
            user.updated_at = datetime.now()
        else:
            # 用户不存在，创建新用户
            if not email:
                email = f"user_{uuid.uuid4()}@example.com"
            if not name:
                name = f"用户_{uuid.uuid4().hex[:8]}"
                
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                name=name,
                token=token,
                last_login_at=datetime.now(),
                last_login_ip=ip_address,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(user)
            is_new_user = True
        
        # 添加设备信息（如果提供）
        if device_info and user:
            # 先将该用户的所有设备设为非当前设备
            await db.execute(
                update(UserDevice)
                .where(UserDevice.user_id == user.id)
                .values(is_current=False)
            )
            
            # 检查是否已存在相同特征的设备
            device_query = (
                select(UserDevice)
                .where(
                    UserDevice.user_id == user.id,
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
                    user_id=user.id,
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
        
        await db.commit()
        if user.id:
            await db.refresh(user)
        
        return user, is_new_user
    
    @staticmethod
    async def get_user_devices(db: AsyncSession, user_id: str) -> List[UserDevice]:
        """获取用户的所有设备"""
        result = await db.execute(
            select(UserDevice).where(UserDevice.user_id == user_id)
        )
        return result.scalars().all()
    
    @staticmethod
    async def update_device(
        db: AsyncSession, 
        device_id: str, 
        device_data: UserDeviceUpdate
    ) -> Optional[UserDevice]:
        """更新设备信息"""
        result = await db.execute(
            select(UserDevice).where(UserDevice.id == device_id)
        )
        device = result.scalars().first()
        
        if not device:
            return None
        
        update_data = device_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(device, key, value)
        
        await db.commit()
        await db.refresh(device)
        return device
    
    @staticmethod
    async def delete_device(db: AsyncSession, device_id: str) -> bool:
        """删除设备"""
        result = await db.execute(
            select(UserDevice).where(UserDevice.id == device_id)
        )
        device = result.scalars().first()
        
        if not device:
            return False
        
        await db.execute(delete(UserDevice).where(UserDevice.id == device_id))
        await db.commit()
        return True
    
    @staticmethod
    async def set_current_device(db: AsyncSession, user_id: str, device_id: str) -> bool:
        """设置当前设备"""
        # 先将所有设备设为非当前设备
        await db.execute(
            update(UserDevice)
            .where(UserDevice.user_id == user_id)
            .values(is_current=False)
        )
        
        # 将指定设备设为当前设备
        result = await db.execute(
            update(UserDevice)
            .where(UserDevice.id == device_id, UserDevice.user_id == user_id)
            .values(is_current=True, last_active_at=datetime.now())
        )
        
        await db.commit()
        return result.rowcount > 0 
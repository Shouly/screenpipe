import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, List

from sqlalchemy import and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from ..models.plugin_license import PluginLicense, LicenseStatus
from ..models.api_models import LicenseCreate, LicenseUpdate


class LicenseService:
    @staticmethod
    def generate_license_key(length: int = 32) -> str:
        """生成随机许可证密钥"""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))

    @staticmethod
    async def create_license(db: AsyncSession, license_data: LicenseCreate) -> PluginLicense:
        """创建新的许可证"""
        # 生成唯一的许可证密钥
        license_key = LicenseService.generate_license_key()
        
        # 创建许可证记录
        db_license = PluginLicense(
            user_id=license_data.user_id,
            plugin_id=license_data.plugin_id,
            license_key=license_key,
            expires_at=license_data.expires_at,
            machine_id=license_data.machine_id,
            is_active=True,
            status=LicenseStatus.ACTIVE.value
        )
        
        db.add(db_license)
        await db.commit()
        await db.refresh(db_license)
        
        return db_license

    @staticmethod
    async def get_license(db: AsyncSession, license_id: int) -> Optional[PluginLicense]:
        """根据ID获取许可证"""
        result = await db.execute(select(PluginLicense).filter(PluginLicense.id == license_id))
        return result.scalars().first()

    @staticmethod
    async def get_license_by_key(db: AsyncSession, license_key: str) -> Optional[PluginLicense]:
        """根据密钥获取许可证"""
        result = await db.execute(select(PluginLicense).filter(PluginLicense.license_key == license_key))
        return result.scalars().first()

    @staticmethod
    async def get_user_licenses(db: AsyncSession, user_id: str, skip: int = 0, limit: int = 100) -> List[PluginLicense]:
        """获取用户的所有许可证"""
        result = await db.execute(
            select(PluginLicense)
            .filter(PluginLicense.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    async def get_plugin_licenses(db: AsyncSession, plugin_id: int, skip: int = 0, limit: int = 100) -> List[PluginLicense]:
        """获取插件的所有许可证"""
        result = await db.execute(
            select(PluginLicense)
            .filter(PluginLicense.plugin_id == plugin_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    async def update_license(db: AsyncSession, license_id: int, license_update: LicenseUpdate) -> Optional[PluginLicense]:
        """更新许可证"""
        db_license = await LicenseService.get_license(db, license_id)
        if not db_license:
            return None
        
        # 更新字段
        update_data = license_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_license, key, value)
        
        await db.commit()
        await db.refresh(db_license)
        
        return db_license

    @staticmethod
    async def verify_license(
        db: AsyncSession, 
        license_key: str, 
        plugin_id: int,
        machine_id: Optional[str] = None
    ) -> tuple[bool, Optional[str], Optional[datetime]]:
        """验证许可证"""
        # 获取许可证
        db_license = await LicenseService.get_license_by_key(db, license_key)
        
        # 检查许可证是否存在
        if not db_license:
            return False, "License not found", None
        
        # 检查许可证是否与插件匹配
        if db_license.plugin_id != plugin_id:
            return False, "License does not match plugin", None
        
        # 检查许可证是否激活
        if not db_license.is_active:
            return False, "License is not active", None
        
        # 检查许可证状态
        if db_license.status != LicenseStatus.ACTIVE.value:
            return False, f"License status is {db_license.status}", None
        
        # 检查许可证是否过期
        if db_license.expires_at and db_license.expires_at < datetime.utcnow():
            # 更新许可证状态为过期
            db_license.status = LicenseStatus.EXPIRED.value
            await db.commit()
            return False, "License has expired", None
        
        # 检查机器ID（如果提供）
        if machine_id and db_license.machine_id and db_license.machine_id != machine_id:
            return False, "License is bound to another machine", None
        
        # 如果许可证有效但尚未绑定机器，则绑定到当前机器
        if machine_id and not db_license.machine_id:
            db_license.machine_id = machine_id
        
        # 更新最后验证时间
        db_license.last_verified_at = datetime.utcnow()
        await db.commit()
        
        return True, None, db_license.expires_at

    @staticmethod
    async def revoke_license(db: AsyncSession, license_id: int) -> bool:
        """撤销许可证"""
        db_license = await LicenseService.get_license(db, license_id)
        if not db_license:
            return False
        
        db_license.is_active = False
        db_license.status = LicenseStatus.REVOKED.value
        
        await db.commit()
        return True

    @staticmethod
    async def check_user_has_license(db: AsyncSession, user_id: str, plugin_id: int) -> bool:
        """检查用户是否拥有插件的有效许可证"""
        result = await db.execute(
            select(PluginLicense).filter(
                and_(
                    PluginLicense.user_id == user_id,
                    PluginLicense.plugin_id == plugin_id,
                    PluginLicense.is_active == True,
                    PluginLicense.status == LicenseStatus.ACTIVE.value,
                    or_(
                        PluginLicense.expires_at == None,
                        PluginLicense.expires_at > datetime.utcnow()
                    )
                )
            )
        )
        return result.scalars().first() is not None 
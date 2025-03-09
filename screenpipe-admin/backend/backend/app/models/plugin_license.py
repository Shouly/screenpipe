from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from ..db.mysql import Base


class LicenseStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"


class PluginLicense(Base):
    __tablename__ = "plugin_licenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    plugin_id = Column(Integer, ForeignKey("plugins.id"), nullable=False)
    license_key = Column(String(255), nullable=False, unique=True, index=True)
    issued_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    status = Column(String(50), default=LicenseStatus.ACTIVE.value)
    machine_id = Column(String(255), nullable=True)
    last_verified_at = Column(DateTime, nullable=True)
    
    # 关联插件
    plugin = relationship("Plugin", backref="licenses")
    
    class Config:
        orm_mode = True 
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from datetime import datetime

from ..db.mysql import Base


def generate_uuid():
    """生成UUID字符串"""
    return str(uuid.uuid4())


class User(Base):
    """用户模型"""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    avatar = Column(String(1024), nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    last_login_ip = Column(String(255), nullable=True)
    token = Column(String(255), unique=True, index=True, nullable=False)
    
    # 关联设备
    devices = relationship("UserDevice", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"


class UserDevice(Base):
    """用户设备模型"""
    __tablename__ = "user_devices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    device_type = Column(Enum("desktop", "mobile", "tablet", "other"), nullable=False)
    os = Column(String(255), nullable=False)
    os_version = Column(String(255), nullable=True)
    browser = Column(String(255), nullable=True)
    browser_version = Column(String(255), nullable=True)
    ip_address = Column(String(255), nullable=True)
    last_active_at = Column(DateTime, default=func.now(), nullable=False)
    is_current = Column(Boolean, default=False, nullable=False)
    
    # 关联用户
    user = relationship("User", back_populates="devices")

    def __repr__(self):
        return f"<UserDevice {self.name} ({self.device_type})>" 
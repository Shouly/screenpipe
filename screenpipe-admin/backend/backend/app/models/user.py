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
    
    # OAuth相关
    oauth_provider = Column(String(50), nullable=True)  # 'google', 'github', etc.
    oauth_id = Column(String(255), nullable=True)
    
    # 设备信息 - 整合到用户表中
    device_name = Column(String(255), nullable=True)
    device_type = Column(Enum("desktop", "mobile", "tablet", "other"), nullable=True)
    device_os = Column(String(255), nullable=True)
    device_os_version = Column(String(255), nullable=True)
    device_browser = Column(String(255), nullable=True)
    device_browser_version = Column(String(255), nullable=True)
    device_last_active_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<User {self.email}>"


class LoginCode(Base):
    """登录码模型 - 用于无密码登录"""
    __tablename__ = "login_codes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)

    def __repr__(self):
        return f"<LoginCode {self.email}>" 
from datetime import datetime
from enum import Enum
from typing import List, Optional

from sqlalchemy import Boolean, Column, DateTime, Enum as SQLAlchemyEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import relationship

from ..db.mysql import Base


class PluginStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DEPRECATED = "deprecated"


class PluginVisibility(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    ORGANIZATION = "organization"


class Plugin(Base):
    __tablename__ = "plugins"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)
    tags = Column(ARRAY(String), nullable=True)
    status = Column(SQLAlchemyEnum(PluginStatus, values_callable=lambda x: [e.value for e in x]), default=PluginStatus.ACTIVE)
    visibility = Column(SQLAlchemyEnum(PluginVisibility, values_callable=lambda x: [e.value for e in x]), default=PluginVisibility.PRIVATE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    downloads_count = Column(Integer, default=0)

    # 关联插件版本
    versions = relationship("PluginVersion", back_populates="plugin", cascade="all, delete-orphan")


class PluginVersion(Base):
    __tablename__ = "plugin_versions"

    id = Column(Integer, primary_key=True, index=True)
    plugin_id = Column(Integer, ForeignKey("plugins.id"), nullable=False)
    version = Column(String, nullable=False)
    zip_url = Column(String, nullable=False)
    zip_hash = Column(String, nullable=False)  # 存储ZIP文件的哈希值
    zip_size = Column(Integer, nullable=False)  # 存储ZIP文件大小（字节）
    changelog = Column(Text, nullable=True)
    min_app_version = Column(String, nullable=True)
    dependencies = Column(JSONB, nullable=True)  # 存储依赖项信息
    created_at = Column(DateTime, default=datetime.utcnow)
    is_latest = Column(Boolean, default=True)
    download_count = Column(Integer, default=0)

    # 关联插件
    plugin = relationship("Plugin", back_populates="versions")

    class Config:
        orm_mode = True 
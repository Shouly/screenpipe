import enum

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..db.mysql import Base


class ProductivityType(str, enum.Enum):
    PRODUCTIVE = "PRODUCTIVE"
    DISTRACTING = "DISTRACTING"
    NEUTRAL = "NEUTRAL"


class AppCategory(Base):
    """应用分类表"""

    __tablename__ = "app_categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    productivity_type = Column(Enum(ProductivityType), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 关系
    hourly_usages = relationship("HourlyAppUsage", back_populates="category")


class HourlyAppUsage(Base):
    """小时应用使用统计表"""

    __tablename__ = "hourly_app_usage"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    hour_of_day = Column(Integer, nullable=False)
    day_of_week = Column(Integer, nullable=False)
    is_working_hour = Column(Boolean, nullable=False)
    app_name = Column(String(100), nullable=False, index=True)
    app_category_id = Column(Integer, ForeignKey("app_categories.id"), nullable=True)
    total_time_seconds = Column(Float, nullable=False)
    switch_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 关系
    category = relationship("AppCategory", back_populates="hourly_usages")

    # 唯一约束
    __table_args__ = (
        {
            "mysql_engine": "InnoDB",
            "mysql_charset": "utf8mb4",
            "mysql_collate": "utf8mb4_unicode_ci",
        },
    )

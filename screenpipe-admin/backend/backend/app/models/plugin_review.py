from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from ..db.mysql import Base


class PluginReview(Base):
    __tablename__ = "plugin_reviews"

    id = Column(Integer, primary_key=True, index=True)
    plugin_id = Column(Integer, ForeignKey("plugins.id"), nullable=False)
    user_id = Column(String(255), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1-5 星
    title = Column(String(255), nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_verified_purchase = Column(Boolean, default=False)
    
    # 关联插件
    plugin = relationship("Plugin", backref="reviews")
    
    class Config:
        orm_mode = True 
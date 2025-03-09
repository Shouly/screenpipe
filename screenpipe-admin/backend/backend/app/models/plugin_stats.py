from datetime import date, datetime
from typing import Optional

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..db.mysql import Base


class PluginStats(Base):
    __tablename__ = "plugin_stats"

    id = Column(Integer, primary_key=True, index=True)
    plugin_id = Column(Integer, ForeignKey("plugins.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    active_installs = Column(Integer, default=0)
    new_installs = Column(Integer, default=0)
    uninstalls = Column(Integer, default=0)
    updates = Column(Integer, default=0)
    downloads = Column(Integer, default=0)
    
    # 关联插件
    plugin = relationship("Plugin", backref="stats")
    
    class Config:
        orm_mode = True


class PluginUsageLog(Base):
    __tablename__ = "plugin_usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    plugin_id = Column(Integer, ForeignKey("plugins.id"), nullable=False)
    user_id = Column(String(255), nullable=False, index=True)
    machine_id = Column(String(255), nullable=True)
    event_type = Column(String(50), nullable=False)  # install, uninstall, update, activate, deactivate
    created_at = Column(DateTime, default=datetime.utcnow)
    version = Column(String(50), nullable=True)
    
    # 关联插件
    plugin = relationship("Plugin", backref="usage_logs")
    
    class Config:
        orm_mode = True 
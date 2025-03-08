from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from enum import Enum
from datetime import datetime


class RemoteCommandType(str, Enum):
    """远程命令类型"""
    LOCK_SCREEN = "LockScreen"  # 锁定屏幕
    SHUTDOWN = "Shutdown"  # 关机
    # 可以根据需要添加更多命令类型


class RemoteCommand(BaseModel):
    """远程命令模型"""
    id: str  # 命令ID
    type: RemoteCommandType  # 命令类型
    params: Optional[Dict[str, Any]] = None  # 命令参数
    timestamp: datetime = Field(default_factory=datetime.now)  # 命令时间戳
    client_id: str  # 目标客户端ID
    
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }


class CommandResult(BaseModel):
    """命令执行结果模型"""
    command_id: str  # 命令ID
    success: bool  # 是否成功
    message: str  # 结果消息
    timestamp: datetime = Field(default_factory=datetime.now)  # 执行时间戳
    client_id: str  # 客户端ID
    
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }


class ClientConnection(BaseModel):
    """客户端连接信息"""
    client_id: str  # 客户端ID
    connected_at: datetime = Field(default_factory=datetime.now)  # 连接时间
    last_heartbeat: datetime = Field(default_factory=datetime.now)  # 最后心跳时间
    is_active: bool = True  # 是否活跃
    metadata: Optional[Dict[str, Any]] = None  # 客户端元数据
    
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }


class ClientListResponse(BaseModel):
    """客户端列表响应"""
    clients: List[ClientConnection]
    total: int 
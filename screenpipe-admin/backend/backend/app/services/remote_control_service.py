import asyncio
import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Any

from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from ..core.config import settings
from ..models.remote_control import RemoteCommand, CommandResult, ClientConnection, RemoteCommandType

logger = logging.getLogger(__name__)


# 自定义JSON编码器，处理datetime对象
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, RemoteCommandType):
            return obj.value
        return super().default(obj)


class RemoteControlService:
    """远程控制服务，管理WebSocket连接和命令发送"""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}  # 客户端ID -> WebSocket连接
        self.client_info: Dict[str, ClientConnection] = {}  # 客户端ID -> 客户端信息
        self.command_results: Dict[str, CommandResult] = {}  # 命令ID -> 命令结果
        self.pending_commands: Dict[str, RemoteCommand] = {}  # 命令ID -> 待处理命令
        self._cleanup_task = None

    async def start(self):
        """启动服务"""
        self._cleanup_task = asyncio.create_task(self._cleanup_inactive_clients())
        logger.info("RemoteControlService started")

    async def stop(self):
        """停止服务"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        
        # 关闭所有连接
        for client_id, websocket in list(self.active_connections.items()):
            await self.disconnect(client_id)
        
        logger.info("RemoteControlService stopped")

    async def connect(self, client_id: str, websocket: WebSocket):
        """处理新的WebSocket连接"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        
        # 更新或创建客户端信息
        if client_id in self.client_info:
            self.client_info[client_id].connected_at = datetime.now()
            self.client_info[client_id].last_heartbeat = datetime.now()
            self.client_info[client_id].is_active = True
        else:
            self.client_info[client_id] = ClientConnection(
                client_id=client_id,
                connected_at=datetime.now(),
                last_heartbeat=datetime.now(),
                is_active=True
            )
        
        logger.info(f"Client connected: {client_id}")
        
        # 发送欢迎消息
        await self.send_message(client_id, {
            "type": "welcome",
            "message": "Connected to Time Glass Remote Control Server",
            "timestamp": datetime.now().isoformat()
        })

    async def disconnect(self, client_id: str):
        """处理WebSocket断开连接"""
        if client_id not in self.active_connections:
            return
            
        websocket = self.active_connections[client_id]
        if websocket.client_state != WebSocketState.DISCONNECTED:
            await websocket.close()
        del self.active_connections[client_id]
        
        if client_id in self.client_info:
            self.client_info[client_id].is_active = False
        
        logger.info(f"Client disconnected: {client_id}")

    async def handle_heartbeat(self, client_id: str):
        """处理客户端心跳"""
        if client_id in self.client_info:
            self.client_info[client_id].last_heartbeat = datetime.now()
            self.client_info[client_id].is_active = True
            logger.debug(f"Heartbeat received from client: {client_id}")
            
            # 发送心跳响应
            await self.send_message(client_id, {
                "id": str(uuid.uuid4()),
                "type": "heartbeat_ack",
                "timestamp": datetime.now().isoformat()
            })

    async def handle_command_result(self, client_id: str, result: CommandResult):
        """处理命令执行结果"""
        command_id = result.command_id
        
        # 存储命令结果
        self.command_results[command_id] = result
        
        # 如果有待处理的命令，移除它
        if command_id in self.pending_commands:
            del self.pending_commands[command_id]
        
        logger.info(f"Command result received from {client_id}: {result.dict()}")

    async def send_command(self, command: RemoteCommand) -> str:
        """发送命令到客户端"""
        client_id = command.client_id
        
        # 检查客户端是否连接
        if client_id not in self.active_connections:
            raise ValueError(f"Client {client_id} is not connected")
        
        # 生成命令ID（如果没有提供）
        if not command.id:
            command.id = str(uuid.uuid4())
        
        # 存储待处理命令
        self.pending_commands[command.id] = command
        
        # 直接发送命令，而不是嵌套在message中
        # 客户端期望直接接收RemoteCommand对象
        command_dict = {
            "id": command.id,
            "type_": command.type.value,  # 注意这里使用type_而不是type
            "params": command.params,
            "timestamp": command.timestamp.isoformat(),
        }
        
        # 发送命令
        await self.send_raw_message(client_id, command_dict)
        
        logger.info(f"Command sent to {client_id}: {command_dict}")
        return command.id

    async def send_raw_message(self, client_id: str, message: Dict[str, Any]):
        """直接发送原始消息到客户端，不添加额外的包装"""
        if client_id not in self.active_connections:
            logger.warning(f"Attempted to send message to disconnected client: {client_id}")
            return
        
        websocket = self.active_connections[client_id]
        try:
            # 使用自定义编码器处理datetime对象
            json_str = json.dumps(message, cls=DateTimeEncoder)
            await websocket.send_text(json_str)
        except Exception as e:
            logger.error(f"Error sending message to client {client_id}: {str(e)}")
            await self.disconnect(client_id)

    async def send_message(self, client_id: str, message: Dict[str, Any]):
        """发送消息到客户端"""
        if client_id not in self.active_connections:
            logger.warning(f"Attempted to send message to disconnected client: {client_id}")
            return
        
        websocket = self.active_connections[client_id]
        try:
            # 使用自定义编码器处理datetime对象
            json_str = json.dumps(message, cls=DateTimeEncoder)
            await websocket.send_text(json_str)
        except Exception as e:
            logger.error(f"Error sending message to client {client_id}: {str(e)}")
            await self.disconnect(client_id)

    async def get_active_clients(self) -> List[ClientConnection]:
        """获取所有活跃的客户端"""
        return [client for client in self.client_info.values() if client.is_active]

    async def get_client_by_id(self, client_id: str) -> Optional[ClientConnection]:
        """根据ID获取客户端信息"""
        return self.client_info.get(client_id)

    async def get_command_result(self, command_id: str) -> Optional[CommandResult]:
        """获取命令执行结果"""
        return self.command_results.get(command_id)
        
    async def get_all_command_results(self) -> List[CommandResult]:
        """获取所有命令执行结果"""
        return list(self.command_results.values())

    async def _cleanup_inactive_clients(self):
        """清理不活跃的客户端"""
        try:
            while True:
                now = datetime.now()
                timeout = timedelta(seconds=settings.WEBSOCKET_CONNECTION_TIMEOUT)
                
                for client_id, client in list(self.client_info.items()):
                    if client.is_active and now - client.last_heartbeat > timeout:
                        logger.info(f"Client {client_id} timed out (no heartbeat)")
                        client.is_active = False
                        await self.disconnect(client_id)
                
                await asyncio.sleep(settings.WEBSOCKET_HEARTBEAT_INTERVAL)
        except asyncio.CancelledError:
            logger.info("Cleanup task cancelled")
        except Exception as e:
            logger.error(f"Error in cleanup task: {str(e)}")


# 创建全局服务实例
remote_control_service = RemoteControlService() 
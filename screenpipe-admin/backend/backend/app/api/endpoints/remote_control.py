import logging
import json
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, Header, status
from fastapi.responses import JSONResponse

from ...core.config import settings
from ...models.remote_control import RemoteCommand, CommandResult, ClientConnection, ClientListResponse, RemoteCommandType
from ...services.remote_control_service import remote_control_service

logger = logging.getLogger(__name__)

router = APIRouter()


# WebSocket连接 - 支持路径参数
@router.websocket("/ws/{client_id}")
async def websocket_endpoint_path(
    websocket: WebSocket, 
    client_id: str, 
    token: Optional[str] = Query(None)
):
    """WebSocket连接端点 - 通过路径参数获取client_id"""
    await handle_websocket_connection(websocket, client_id, token)


# WebSocket连接 - 支持查询参数
@router.websocket("/ws")
async def websocket_endpoint_query(
    websocket: WebSocket,
    client_id: str = Query(...),
    token: Optional[str] = Query(None)
):
    """WebSocket连接端点 - 通过查询参数获取client_id"""
    await handle_websocket_connection(websocket, client_id, token)


# 处理WebSocket连接的通用函数
async def handle_websocket_connection(websocket: WebSocket, client_id: str, token: Optional[str]):
    """处理WebSocket连接的通用函数"""
    logger.info(f"收到来自客户端 {client_id} 的WebSocket连接请求")
    logger.info(f"客户端提供的令牌: {token}")
    logger.info(f"系统配置的令牌: {settings.WEBSOCKET_AUTH_TOKEN}")
    logger.info(f"认证要求: {settings.WEBSOCKET_AUTH_REQUIRED}")
    
    # 暂时禁用认证，用于调试
    # if settings.WEBSOCKET_AUTH_REQUIRED:
    #     if token != settings.WEBSOCKET_AUTH_TOKEN:
    #         logger.warning(f"客户端 {client_id} 认证失败: 无效的令牌")
    #         await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
    #         return
    
    # 接受连接
    await remote_control_service.connect(client_id, websocket)
    logger.info(f"客户端 {client_id} 连接成功")
    
    try:
        while True:
            # 接收消息
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                message_type = message.get("type")
                
                if message_type == "heartbeat":
                    # 处理心跳
                    await remote_control_service.handle_heartbeat(client_id)
                
                elif message_type == "command_result":
                    # 处理命令执行结果
                    result_data = message.get("result")
                    if result_data:
                        result = CommandResult(**result_data)
                        await remote_control_service.handle_command_result(client_id, result)
                
                else:
                    logger.warning(f"Unknown message type from client {client_id}: {message_type}")
            
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON from client {client_id}: {data}")
            
            except Exception as e:
                logger.error(f"Error processing message from client {client_id}: {str(e)}")
    
    except WebSocketDisconnect:
        logger.info(f"客户端 {client_id} 断开连接")
        await remote_control_service.disconnect(client_id)


# API端点 - 获取客户端列表
@router.get("/clients", response_model=ClientListResponse)
async def get_clients():
    """获取所有活跃的客户端列表"""
    clients = await remote_control_service.get_active_clients()
    return ClientListResponse(clients=clients, total=len(clients))


# API端点 - 获取客户端详情
@router.get("/clients/{client_id}", response_model=ClientConnection)
async def get_client(client_id: str):
    """获取指定客户端的详情"""
    client = await remote_control_service.get_client_by_id(client_id)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client {client_id} not found")
    return client


# API端点 - 发送锁屏命令
@router.post("/clients/{client_id}/lock-screen", response_model=dict)
async def lock_screen(client_id: str):
    """发送锁屏命令到指定客户端"""
    try:
        command = RemoteCommand(
            id=str(uuid.uuid4()),
            type=RemoteCommandType.LOCK_SCREEN,
            client_id=client_id
        )
        command_id = await remote_control_service.send_command(command)
        return {
            "success": True,
            "message": f"Lock screen command sent to client {client_id}",
            "command_id": command_id
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error sending lock screen command: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send command: {str(e)}")


# API端点 - 发送关机命令
@router.post("/clients/{client_id}/shutdown", response_model=dict)
async def shutdown(client_id: str, delay_seconds: int = Query(0, ge=0, le=3600)):
    """发送关机命令到指定客户端"""
    try:
        command = RemoteCommand(
            id=str(uuid.uuid4()),
            type=RemoteCommandType.SHUTDOWN,
            params={"delay_seconds": delay_seconds},
            client_id=client_id
        )
        command_id = await remote_control_service.send_command(command)
        return {
            "success": True,
            "message": f"Shutdown command sent to client {client_id} with {delay_seconds}s delay",
            "command_id": command_id
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error sending shutdown command: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send command: {str(e)}")


# API端点 - 获取命令执行结果
@router.get("/commands/{command_id}", response_model=Optional[CommandResult])
async def get_command_result(command_id: str):
    """获取命令执行结果"""
    result = await remote_control_service.get_command_result(command_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Command result for {command_id} not found")
    return result


# API端点 - 获取所有命令执行结果
@router.get("/commands", response_model=dict)
async def get_all_command_results():
    """获取所有命令执行结果"""
    results = await remote_control_service.get_all_command_results()
    return {
        "results": results,
        "total": len(results)
    } 
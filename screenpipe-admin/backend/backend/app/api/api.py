from fastapi import APIRouter
from .endpoints import data, query, app_usage, remote_control, plugin

api_router = APIRouter()

# 添加数据路由
api_router.include_router(data.router, prefix="/data", tags=["data"])

# 添加查询路由
api_router.include_router(query.router, prefix="/query", tags=["query"])

# 添加应用使用分析路由
api_router.include_router(app_usage.router, prefix="/app-usage", tags=["app-usage"])

# 添加远程控制路由
api_router.include_router(remote_control.router, prefix="/remote-control", tags=["remote-control"])

# 添加插件管理路由
api_router.include_router(plugin.router, prefix="/plugin", tags=["plugin"]) 
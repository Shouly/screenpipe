from fastapi import APIRouter
from .endpoints import data, query, app_usage, remote_control, plugin, user, plugin_compat, license, review, stats

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

# 添加用户管理路由
api_router.include_router(user.router, prefix="/user", tags=["user"])

# 添加许可证管理路由
api_router.include_router(license.router, prefix="/license", tags=["license"])

# 添加评论管理路由
api_router.include_router(review.router, prefix="/review", tags=["review"])

# 添加统计管理路由
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])

# 添加Screenpipe兼容API路由
api_router.include_router(plugin_compat.router, prefix="/plugins", tags=["plugins-compat"]) 
from fastapi import APIRouter
from .endpoints import data, query, app_usage, remote_control, user
from .endpoints.plugin import admin_plugin, client_plugin, license_plugin, review_plugin, stats_plugin

api_router = APIRouter()

# 添加数据路由
api_router.include_router(data.router, prefix="/data", tags=["data"])

# 添加查询路由
api_router.include_router(query.router, prefix="/query", tags=["query"])

# 添加应用使用分析路由
api_router.include_router(app_usage.router, prefix="/app-usage", tags=["app-usage"])

# 添加远程控制路由
api_router.include_router(remote_control.router, prefix="/remote-control", tags=["remote-control"])

# 添加用户管理路由
api_router.include_router(user.router, prefix="/user", tags=["user"])

# 插件相关路由

# 添加插件管理路由（管理后台API）
api_router.include_router(admin_plugin.router, prefix="/admin/plugins", tags=["admin-plugins"])

# 添加插件客户端路由（应用客户端API）
api_router.include_router(client_plugin.router, prefix="/plugins", tags=["client-plugins"])

# 添加许可证管理路由
api_router.include_router(license_plugin.router, prefix="/admin/licenses", tags=["plugin-licenses"])

# 添加评论管理路由
api_router.include_router(review_plugin.router, prefix="/plugin/reviews", tags=["plugin-reviews"])

# 添加统计管理路由
api_router.include_router(stats_plugin.router, prefix="/plugin/stats", tags=["plugin-stats"]) 
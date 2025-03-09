from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from ...db.mysql import get_db
from ...models.plugin import PluginVisibility, PluginStatus
from ...models.api_models import UserInDB
from ...services.plugin_service import PluginService
from ...services.license_service import LicenseService
from ...core.config import settings
from ..deps import get_optional_current_user, get_current_user

router = APIRouter()

# 请求模型
class DownloadPluginRequest(BaseModel):
    pipe_id: str

class PurchasePluginRequest(BaseModel):
    pipe_id: str

class CheckUpdateRequest(BaseModel):
    pipe_id: str
    version: str

class CheckUpdatesRequest(BaseModel):
    plugins: List[Dict[str, str]]

# 兼容Screenpipe客户端的插件注册表API
@router.get("/registry")
async def plugin_registry_compatible(
    current_user: Optional[UserInDB] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """兼容Screenpipe客户端的插件注册表API"""
    # 获取公开插件列表
    plugins = await PluginService.get_public_plugins(db)
    
    # 如果用户已登录，还获取用户已购买的私有插件
    if current_user:
        # 获取用户已购买的私有插件
        user_licensed_plugins = await PluginService.get_user_licensed_plugins(db, current_user.id)
        # 合并公开插件和用户已购买的私有插件
        plugins = list(plugins)
        for plugin in user_licensed_plugins:
            if plugin not in plugins:
                plugins.append(plugin)
    
    # 转换为Screenpipe客户端期望的格式
    result = []
    for p in plugins:
        # 获取最新版本
        latest_version = None
        for v in p.versions:
            if v.is_latest:
                latest_version = v
                break
        
        # 检查用户是否已购买此插件
        is_purchased = False
        if current_user:
            is_purchased = await LicenseService.check_user_has_license(db, current_user.id, p.id)
        
        result.append({
            "id": str(p.id),  # Screenpipe使用字符串ID
            "name": p.name,
            "description": p.description,
            "is_paid": p.visibility == PluginVisibility.PRIVATE and not is_purchased,  # 如果是私有插件且用户未购买，则标记为付费
            "price": 0,  # 示例价格，实际应用中应从插件配置中获取
            "status": p.status.value,
            "created_at": p.created_at.isoformat(),
            "source_code": None,  # 可选字段
            "developer_accounts": {
                "developer_name": getattr(p, "developer_name", "Your Organization")  # 替换为实际开发者信息
            },
            "plugin_analytics": {
                "downloads_count": p.downloads_count
            }
        })
    
    return result

# 兼容Screenpipe客户端的下载API
@router.post("/download")
async def download_plugin_compatible(
    request: DownloadPluginRequest,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """兼容Screenpipe客户端的下载API"""
    pipe_id = request.pipe_id
    
    # 获取插件
    plugin = await PluginService.get_plugin(db, int(pipe_id))
    if not plugin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plugin not found"
        )
    
    # 检查用户是否有权限下载此插件
    if plugin.visibility == PluginVisibility.PRIVATE:
        has_license = await LicenseService.check_user_has_license(db, current_user.id, int(pipe_id))
        if not has_license:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You need to purchase this plugin first"
            )
    
    # 获取最新版本
    latest_version = None
    for v in plugin.versions:
        if v.is_latest:
            latest_version = v
            break
            
    if not latest_version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No versions available for this plugin"
        )
    
    # 构建下载URL (使用绝对URL)
    base_url = settings.BASE_URL.rstrip('/')
    download_url = f"{base_url}/api/v1/plugin/plugins/{pipe_id}/versions/{latest_version.version}/download"
    
    # 返回Screenpipe客户端期望的格式
    return {
        "download_url": download_url,
        "file_hash": latest_version.zip_hash,
        "file_size": latest_version.zip_size
    }

# 兼容Screenpipe客户端的购买API
@router.post("/purchase")
async def purchase_plugin_compatible(
    request: PurchasePluginRequest,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """兼容Screenpipe客户端的购买API"""
    pipe_id = request.pipe_id
    
    # 获取插件
    plugin = await PluginService.get_plugin(db, int(pipe_id))
    if not plugin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plugin not found"
        )
    
    # 检查用户是否已购买此插件
    has_license = await LicenseService.check_user_has_license(db, current_user.id, int(pipe_id))
    if has_license:
        return {
            "data": {
                "already_purchased": True
            }
        }
    
    # 创建许可证
    license_data = {
        "user_id": current_user.id,
        "plugin_id": int(pipe_id),
        "expires_at": None  # 永久许可证
    }
    from ...models.api_models import LicenseCreate
    await LicenseService.create_license(db, LicenseCreate(**license_data))
    
    return {
        "data": {
            "payment_successful": True
        }
    }

# 兼容Screenpipe客户端的更新检查API
@router.post("/check-update")
async def check_update_compatible(
    request: CheckUpdateRequest,
    current_user: Optional[UserInDB] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """兼容Screenpipe客户端的更新检查API"""
    pipe_id = request.pipe_id
    current_version = request.version
    
    # 获取插件
    plugin = await PluginService.get_plugin(db, int(pipe_id))
    if not plugin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plugin not found"
        )
    
    # 检查用户是否有权限访问此插件
    if plugin.visibility == PluginVisibility.PRIVATE and current_user:
        has_license = await LicenseService.check_user_has_license(db, current_user.id, int(pipe_id))
        if not has_license:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this plugin"
            )
    
    # 获取最新版本
    latest_version = None
    for v in plugin.versions:
        if v.is_latest:
            latest_version = v
            break
            
    if not latest_version:
        return {
            "has_update": False,
            "current_version": current_version,
            "latest_version": current_version
        }
    
    # 检查是否有更新
    has_update = PluginService._compare_versions(current_version, latest_version.version)
    
    return {
        "has_update": has_update,
        "current_version": current_version,
        "latest_version": latest_version.version,
        "latest_file_hash": latest_version.zip_hash if has_update else None,
        "latest_file_size": latest_version.zip_size if has_update else None
    }

# 兼容Screenpipe客户端的批量更新检查API
@router.post("/check-updates")
async def check_updates_compatible(
    request: CheckUpdatesRequest,
    current_user: Optional[UserInDB] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """兼容Screenpipe客户端的批量更新检查API"""
    results = []
    
    for plugin_info in request.plugins:
        pipe_id = plugin_info.get("pipe_id")
        current_version = plugin_info.get("version")
        
        if not pipe_id or not current_version:
            results.append({
                "pipe_id": pipe_id or "unknown",
                "error": "Missing pipe_id or version",
                "status": 400
            })
            continue
        
        try:
            # 获取插件
            plugin = await PluginService.get_plugin(db, int(pipe_id))
            if not plugin:
                results.append({
                    "pipe_id": pipe_id,
                    "error": "Plugin not found",
                    "status": 404
                })
                continue
            
            # 检查用户是否有权限访问此插件
            if plugin.visibility == PluginVisibility.PRIVATE and current_user:
                has_license = await LicenseService.check_user_has_license(db, current_user.id, int(pipe_id))
                if not has_license:
                    results.append({
                        "pipe_id": pipe_id,
                        "error": "Permission denied",
                        "status": 403
                    })
                    continue
            
            # 获取最新版本
            latest_version = None
            for v in plugin.versions:
                if v.is_latest:
                    latest_version = v
                    break
                    
            if not latest_version:
                results.append({
                    "pipe_id": pipe_id,
                    "has_update": False,
                    "current_version": current_version,
                    "latest_version": current_version
                })
                continue
            
            # 检查是否有更新
            has_update = PluginService._compare_versions(current_version, latest_version.version)
            
            results.append({
                "pipe_id": pipe_id,
                "has_update": has_update,
                "current_version": current_version,
                "latest_version": latest_version.version,
                "latest_file_hash": latest_version.zip_hash if has_update else None,
                "latest_file_size": latest_version.zip_size if has_update else None
            })
            
        except Exception as e:
            results.append({
                "pipe_id": pipe_id,
                "error": str(e),
                "status": 500
            })
    
    return {"results": results} 
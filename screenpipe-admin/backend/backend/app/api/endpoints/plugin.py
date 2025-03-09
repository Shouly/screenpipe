import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Path, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.mysql import get_db
from backend.app.models.api_models import (
    PluginCreate, PluginResponse, PluginUpdate, 
    PluginVersionCreate, PluginVersionResponse,
    PluginUpdateCheckRequest, PluginUpdateCheckResponse,
    UserInDB
)
from backend.app.models.plugin import PluginVisibility
from backend.app.services.plugin_service import PluginService
from backend.app.services.license_service import LicenseService
from backend.app.core.config import settings
from ..deps import get_current_user, get_optional_current_user

router = APIRouter()


# 管理API端点
@router.post("/admin/plugins", response_model=PluginResponse, status_code=status.HTTP_201_CREATED)
async def create_plugin(
    plugin: PluginCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建新插件"""
    db_plugin = await PluginService.get_plugin_by_name(db, plugin.name)
    if db_plugin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plugin with this name already exists"
        )
    return await PluginService.create_plugin(db, plugin)


@router.get("/admin/plugins", response_model=List[PluginResponse])
async def get_plugins(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """获取插件列表"""
    plugins = await PluginService.get_plugins(db, skip, limit)
    return plugins


@router.get("/admin/plugins/{plugin_id}", response_model=PluginResponse)
async def get_plugin(
    plugin_id: int = Path(..., title="插件ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取插件详情"""
    db_plugin = await PluginService.get_plugin(db, plugin_id)
    if db_plugin is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plugin not found"
        )
    return db_plugin


@router.put("/admin/plugins/{plugin_id}", response_model=PluginResponse)
async def update_plugin(
    plugin_update: PluginUpdate,
    plugin_id: int = Path(..., title="插件ID"),
    db: AsyncSession = Depends(get_db)
):
    """更新插件信息"""
    db_plugin = await PluginService.update_plugin(db, plugin_id, plugin_update)
    if not db_plugin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plugin not found"
        )
    return db_plugin


@router.delete("/admin/plugins/{plugin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plugin(
    plugin_id: int = Path(..., title="插件ID"),
    db: AsyncSession = Depends(get_db)
):
    """删除插件"""
    result = await PluginService.delete_plugin(db, plugin_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plugin not found"
        )
    return None


@router.post("/admin/plugins/{plugin_id}/versions", response_model=PluginVersionResponse)
async def create_plugin_version(
    plugin_id: int = Path(..., title="插件ID"),
    version: str = Form(..., title="版本号"),
    changelog: Optional[str] = Form(None, title="更新日志"),
    min_app_version: Optional[str] = Form(None, title="最低应用版本"),
    dependencies: Optional[str] = Form(None, title="依赖项（JSON格式）"),
    zip_file: UploadFile = File(..., title="ZIP文件"),
    db: AsyncSession = Depends(get_db)
):
    """上传新版本"""
    # 创建版本数据对象
    version_data = PluginVersionCreate(
        version=version,
        changelog=changelog,
        min_app_version=min_app_version,
        dependencies=dependencies
    )
    
    # 调用服务创建版本
    try:
        db_version = await PluginService.create_plugin_version(
            db, plugin_id, version_data, zip_file
        )
        return db_version
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create plugin version: {str(e)}"
        )


@router.get("/admin/plugins/{plugin_id}/versions", response_model=List[PluginVersionResponse])
async def get_plugin_versions(
    plugin_id: int = Path(..., title="插件ID"),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """获取插件版本列表"""
    versions = await PluginService.get_plugin_versions(db, plugin_id, skip, limit)
    return versions


@router.delete("/admin/plugins/{plugin_id}/versions/{version_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plugin_version(
    plugin_id: int = Path(..., title="插件ID"),
    version_id: int = Path(..., title="版本ID"),
    db: AsyncSession = Depends(get_db)
):
    """删除插件版本"""
    result = await PluginService.delete_plugin_version(db, plugin_id, version_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plugin version not found"
        )
    return None


# 客户端API端点
@router.post("/plugins/check-updates", response_model=PluginUpdateCheckResponse)
async def check_plugin_updates(
    request: PluginUpdateCheckRequest,
    current_user: Optional[UserInDB] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """检查插件更新"""
    results = []
    
    for plugin_item in request.plugins:
        try:
            pipe_id = plugin_item.pipe_id
            version = plugin_item.version
            
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
            if plugin.visibility == PluginVisibility.PRIVATE:
                if not current_user:
                    results.append({
                        "pipe_id": pipe_id,
                        "error": "Authentication required",
                        "status": 401
                    })
                    continue
                
                has_license = await LicenseService.check_user_has_license(db, current_user.id, int(pipe_id))
                if not has_license:
                    results.append({
                        "pipe_id": pipe_id,
                        "error": "Permission denied",
                        "status": 403
                    })
                    continue
            
            # 获取最新版本
            latest_version = await PluginService.get_latest_plugin_version(db, int(pipe_id))
            if not latest_version:
                results.append({
                    "pipe_id": pipe_id,
                    "has_update": False,
                    "current_version": version,
                    "latest_version": version
                })
                continue
            
            # 检查是否有更新
            has_update = PluginService._compare_versions(version, latest_version.version)
            
            # 构建下载URL
            base_url = settings.BASE_URL.rstrip('/')
            download_url = f"{base_url}/api/v1/plugin/plugins/{pipe_id}/versions/{latest_version.version}/download"
            
            results.append({
                "pipe_id": pipe_id,
                "has_update": has_update,
                "current_version": version,
                "latest_version": latest_version.version,
                "latest_file_hash": latest_version.zip_hash if has_update else None,
                "latest_file_size": latest_version.zip_size if has_update else None,
                "download_url": download_url if has_update else None,
                "changelog": latest_version.changelog if has_update else None
            })
        except Exception as e:
            results.append({
                "pipe_id": plugin_item.pipe_id,
                "error": str(e),
                "status": 500
            })
    
    return PluginUpdateCheckResponse(results=results)


@router.get("/plugins/{plugin_id}/versions/{version}/download")
async def download_plugin(
    plugin_id: int = Path(..., title="插件ID"),
    version: str = Path(..., title="版本号"),
    current_user: Optional[UserInDB] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """下载插件版本"""
    # 检查插件是否存在
    plugin = await PluginService.get_plugin(db, plugin_id)
    if not plugin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plugin not found"
        )
    
    # 检查版本是否存在
    db_version = await PluginService.get_plugin_version_by_version(db, plugin_id, version)
    if not db_version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plugin version not found"
        )
    
    # 检查用户是否有权限下载此插件
    if plugin.visibility == PluginVisibility.PRIVATE:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to download this plugin"
            )
        
        has_license = await LicenseService.check_user_has_license(db, current_user.id, plugin_id)
        if not has_license:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You need to purchase this plugin first"
            )
    
    # 构建文件路径
    file_path = os.path.join(
        settings.PLUGIN_STORAGE_PATH,
        str(plugin_id),
        version,
        f"{plugin.name}_{version}.zip"
    )
    
    # 检查文件是否存在
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plugin file not found"
        )
    
    # 增加下载计数
    await PluginService.increment_download_count(db, plugin_id, db_version.id)
    
    # 返回文件
    return FileResponse(
        path=file_path,
        filename=f"{plugin.name}_{version}.zip",
        media_type="application/zip"
    ) 
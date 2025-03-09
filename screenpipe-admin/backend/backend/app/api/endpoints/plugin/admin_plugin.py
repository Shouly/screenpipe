import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Path, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ....db.mysql import get_db
from ....models.api_models import (
    PluginCreate, PluginResponse, PluginUpdate, 
    PluginVersionCreate, PluginVersionResponse
)
from ....services.plugin_service import PluginService
from ....core.config import settings

router = APIRouter()


@router.post("/", response_model=PluginResponse, status_code=status.HTTP_201_CREATED)
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


@router.get("/", response_model=List[PluginResponse])
async def get_plugins(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """获取插件列表"""
    plugins = await PluginService.get_plugins(db, skip, limit)
    return plugins


@router.get("/{plugin_id}", response_model=PluginResponse)
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


@router.put("/{plugin_id}", response_model=PluginResponse)
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


@router.delete("/{plugin_id}", status_code=status.HTTP_204_NO_CONTENT)
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


@router.post("/{plugin_id}/versions", response_model=PluginVersionResponse)
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


@router.get("/{plugin_id}/versions", response_model=List[PluginVersionResponse])
async def get_plugin_versions(
    plugin_id: int = Path(..., title="插件ID"),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """获取插件版本列表"""
    versions = await PluginService.get_plugin_versions(db, plugin_id, skip, limit)
    return versions


@router.delete("/{plugin_id}/versions/{version_id}", status_code=status.HTTP_204_NO_CONTENT)
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
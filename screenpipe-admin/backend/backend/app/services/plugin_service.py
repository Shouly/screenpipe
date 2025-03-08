import hashlib
import os
import shutil
import tempfile
import zipfile
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import desc
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.models.plugin import Plugin, PluginVersion
from backend.app.models.api_models import (
    PluginCreate, PluginUpdate, PluginVersionCreate,
    PluginUpdateCheckItem, PluginUpdateCheckResultItem
)
from backend.app.core.config import settings


class PluginService:
    @staticmethod
    async def get_plugins(db: AsyncSession, skip: int = 0, limit: int = 100):
        """获取插件列表"""
        result = await db.execute(
            select(Plugin)
            .options(selectinload(Plugin.versions))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    async def get_plugin(db: AsyncSession, plugin_id: int):
        """根据ID获取插件"""
        result = await db.execute(
            select(Plugin)
            .options(selectinload(Plugin.versions))
            .filter(Plugin.id == plugin_id)
        )
        return result.scalars().first()

    @staticmethod
    async def get_plugin_by_name(db: AsyncSession, name: str):
        """根据名称获取插件"""
        result = await db.execute(select(Plugin).filter(Plugin.name == name))
        return result.scalars().first()

    @staticmethod
    async def create_plugin(db: AsyncSession, plugin: PluginCreate):
        """创建新插件"""
        db_plugin = Plugin(**plugin.dict())
        db.add(db_plugin)
        await db.commit()
        await db.refresh(db_plugin)
        return db_plugin

    @staticmethod
    async def update_plugin(db: AsyncSession, plugin_id: int, plugin_update: PluginUpdate):
        """更新插件信息"""
        db_plugin = await PluginService.get_plugin(db, plugin_id)
        if not db_plugin:
            return None
        
        # 更新字段
        update_data = plugin_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_plugin, key, value)
        
        await db.commit()
        await db.refresh(db_plugin)
        return db_plugin

    @staticmethod
    async def delete_plugin(db: AsyncSession, plugin_id: int):
        """删除插件"""
        db_plugin = await PluginService.get_plugin(db, plugin_id)
        if not db_plugin:
            return False

        await db.delete(db_plugin)
        await db.commit()
        return True

    @staticmethod
    async def get_plugin_versions(db: AsyncSession, plugin_id: int, skip: int = 0, limit: int = 100):
        """获取插件版本列表"""
        result = await db.execute(
            select(PluginVersion)
            .filter(PluginVersion.plugin_id == plugin_id)
            .order_by(desc(PluginVersion.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    async def get_plugin_version(db: AsyncSession, version_id: int):
        """根据ID获取插件版本"""
        result = await db.execute(
            select(PluginVersion)
            .filter(PluginVersion.id == version_id)
        )
        return result.scalars().first()

    @staticmethod
    async def get_plugin_version_by_version(db: AsyncSession, plugin_id: int, version: str):
        """根据版本号获取插件版本"""
        result = await db.execute(
            select(PluginVersion)
            .filter(
                PluginVersion.plugin_id == plugin_id,
                PluginVersion.version == version
            )
        )
        return result.scalars().first()

    @staticmethod
    async def get_latest_plugin_version(db: AsyncSession, plugin_id: int):
        """获取插件的最新版本"""
        result = await db.execute(
            select(PluginVersion)
            .filter(
                PluginVersion.plugin_id == plugin_id,
                PluginVersion.is_latest == True
            )
        )
        return result.scalars().first()

    @staticmethod
    async def create_plugin_version(
        db: AsyncSession, 
        plugin_id: int, 
        version_data: PluginVersionCreate, 
        zip_file: UploadFile
    ):
        """创建新的插件版本"""
        # 检查插件是否存在
        db_plugin = PluginService.get_plugin(db, plugin_id)
        if not db_plugin:
            raise HTTPException(status_code=404, detail="Plugin not found")

        # 检查版本是否已存在
        existing_version = PluginService.get_plugin_version_by_version(
            db, plugin_id, version_data.version
        )
        if existing_version:
            raise HTTPException(status_code=400, detail="Version already exists")

        # 创建临时目录处理上传的ZIP文件
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_file_path = os.path.join(temp_dir, f"{db_plugin.name}_{version_data.version}.zip")
            
            # 保存上传的文件
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(zip_file.file, buffer)
            
            # 验证ZIP文件
            if not zipfile.is_zipfile(temp_file_path):
                raise HTTPException(status_code=400, detail="Invalid ZIP file")
            
            try:
                # 验证ZIP文件结构
                with zipfile.ZipFile(temp_file_path, 'r') as zip_ref:
                    file_list = zip_ref.namelist()
                    
                    # 检查必要文件是否存在
                    if "package.json" not in file_list:
                        raise HTTPException(status_code=400, detail="Missing package.json in ZIP file")
            except zipfile.BadZipFile:
                raise HTTPException(status_code=400, detail="Corrupted ZIP file")
            
            # 计算文件哈希和大小
            file_hash = PluginService._calculate_file_hash(temp_file_path)
            file_size = os.path.getsize(temp_file_path)
            
            # 存储ZIP文件
            storage_path = os.path.join(
                settings.PLUGIN_STORAGE_PATH, 
                str(plugin_id), 
                version_data.version
            )
            os.makedirs(storage_path, exist_ok=True)
            final_path = os.path.join(storage_path, f"{db_plugin.name}_{version_data.version}.zip")
            shutil.copy(temp_file_path, final_path)
            
            # 构建ZIP文件URL
            zip_url = f"/plugins/{plugin_id}/versions/{version_data.version}/download"
            
            # 更新之前的最新版本
            latest_version = await PluginService.get_latest_plugin_version(db, plugin_id)
            if latest_version:
                latest_version.is_latest = False
                db.add(latest_version)
            
            # 创建新版本记录
            db_version = PluginVersion(
                plugin_id=plugin_id,
                version=version_data.version,
                zip_url=zip_url,
                zip_hash=file_hash,
                zip_size=file_size,
                changelog=version_data.changelog,
                min_app_version=version_data.min_app_version,
                dependencies=version_data.dependencies,
                is_latest=True
            )
            
            db.add(db_version)
            db.commit()
            db.refresh(db_version)
            
            return db_version

    @staticmethod
    async def delete_plugin_version(db: AsyncSession, plugin_id: int, version_id: int):
        """删除插件版本"""
        result = await db.execute(
            select(PluginVersion)
            .filter(
                PluginVersion.id == version_id,
                PluginVersion.plugin_id == plugin_id
            )
        )
        db_version = result.scalars().first()
        
        if not db_version:
            return False
        
        # 如果是最新版本，需要更新其他版本的状态
        if db_version.is_latest:
            # 找到下一个最新版本
            result = await db.execute(
                select(PluginVersion)
                .filter(
                    PluginVersion.plugin_id == plugin_id,
                    PluginVersion.id != version_id
                )
                .order_by(desc(PluginVersion.created_at))
            )
            next_latest = result.scalars().first()
            
            if next_latest:
                next_latest.is_latest = True
                db.add(next_latest)
        
        # 删除文件
        try:
            storage_path = os.path.join(
                settings.PLUGIN_STORAGE_PATH, 
                str(plugin_id), 
                db_version.version
            )
            if os.path.exists(storage_path):
                shutil.rmtree(storage_path)
        except Exception as e:
            # 记录错误但继续删除数据库记录
            print(f"Error deleting plugin version files: {e}")
        
        await db.delete(db_version)
        await db.commit()
        return True

    @staticmethod
    def check_updates(db: Session, plugins: List[PluginUpdateCheckItem]) -> List[PluginUpdateCheckResultItem]:
        """检查插件更新"""
        results = []
        
        for item in plugins:
            # 查找插件
            db_plugin = db.query(Plugin).filter(Plugin.name == item.pipe_id).first()
            if not db_plugin:
                # 插件不存在
                results.append(PluginUpdateCheckResultItem(
                    pipe_id=item.pipe_id,
                    has_update=False,
                    current_version=item.version,
                    latest_version=item.version
                ))
                continue
            
            # 获取最新版本
            latest_version = PluginService.get_latest_plugin_version(db, db_plugin.id)
            if not latest_version:
                # 没有版本信息
                results.append(PluginUpdateCheckResultItem(
                    pipe_id=item.pipe_id,
                    has_update=False,
                    current_version=item.version,
                    latest_version=item.version
                ))
                continue
            
            # 比较版本
            has_update = PluginService._compare_versions(item.version, latest_version.version)
            
            result = PluginUpdateCheckResultItem(
                pipe_id=item.pipe_id,
                has_update=has_update,
                current_version=item.version,
                latest_version=latest_version.version
            )
            
            # 如果有更新，添加更多信息
            if has_update:
                result.latest_file_hash = latest_version.zip_hash
                result.latest_file_size = latest_version.zip_size
                result.download_url = latest_version.zip_url
                result.changelog = latest_version.changelog
            
            results.append(result)
        
        return results

    @staticmethod
    def increment_download_count(db: Session, plugin_id: int, version_id: int = None):
        """增加下载计数"""
        db_plugin = PluginService.get_plugin(db, plugin_id)
        if not db_plugin:
            return False
        
        # 增加插件总下载次数
        db_plugin.downloads_count += 1
        db.add(db_plugin)
        
        # 如果指定了版本，增加版本下载次数
        if version_id:
            db_version = PluginService.get_plugin_version(db, version_id)
            if db_version:
                db_version.download_count += 1
                db.add(db_version)
        
        db.commit()
        return True

    @staticmethod
    def _calculate_file_hash(file_path: str) -> str:
        """计算文件的SHA256哈希值"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            # 读取文件块并更新哈希
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return f"sha256:{sha256_hash.hexdigest()}"

    @staticmethod
    def _compare_versions(current: str, latest: str) -> bool:
        """比较版本号，判断是否有更新
        
        使用语义化版本比较，如果latest版本大于current版本，返回True
        """
        try:
            current_parts = [int(x) for x in current.split('.')]
            latest_parts = [int(x) for x in latest.split('.')]
            
            # 补齐版本号长度
            while len(current_parts) < 3:
                current_parts.append(0)
            while len(latest_parts) < 3:
                latest_parts.append(0)
            
            # 比较版本号
            for i in range(3):
                if latest_parts[i] > current_parts[i]:
                    return True
                elif latest_parts[i] < current_parts[i]:
                    return False
            
            # 版本号相同
            return False
        except (ValueError, IndexError):
            # 版本号格式错误，默认不更新
            return False 
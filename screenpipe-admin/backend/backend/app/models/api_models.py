from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field, EmailStr

from .plugin import PluginStatus, PluginVisibility


# 生产力类型枚举
class ProductivityTypeEnum(str, Enum):
    PRODUCTIVE = "PRODUCTIVE"
    NEUTRAL = "NEUTRAL"
    DISTRACTING = "DISTRACTING"


# 应用类别模型
class AppCategoryCreate(BaseModel):
    name: str
    productivity_type: ProductivityTypeEnum


class AppCategoryResponse(BaseModel):
    id: int
    name: str
    productivity_type: ProductivityTypeEnum
    created_at: datetime


# 通用分页响应模型
T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int


# 生产力统计摘要模型
class ProductivitySummary(BaseModel):
    start_date: date
    end_date: date
    productive_minutes: float
    neutral_minutes: float
    distracting_minutes: float
    total_minutes: float
    productive_percentage: float
    neutral_percentage: float
    distracting_percentage: float
    
    # 与前一天比较
    yesterday_total_minutes: Optional[float] = None
    yesterday_productive_minutes: Optional[float] = None
    yesterday_neutral_minutes: Optional[float] = None
    yesterday_distracting_minutes: Optional[float] = None
    yesterday_productive_percentage: Optional[float] = None
    
    # 趋势信息
    total_minutes_change_percentage: Optional[float] = None  # 总时间变化百分比
    productive_percentage_change: Optional[float] = None  # 效率指数变化（百分点）
    
    # 应用统计
    most_used_app: Optional[str] = None  # 最常用应用
    most_used_app_percentage: Optional[float] = None  # 最常用应用占比
    
    # 异常信息
    anomaly_count: Optional[int] = None  # 异常行为数量
    anomaly_description: Optional[str] = None  # 异常描述


# 应用使用统计响应模型
class AppUsageStats(BaseModel):
    app_name: str
    total_time_seconds: float
    percentage: float
    category: Optional[str] = None
    productivity_type: Optional[str] = None


class HourlyUsageStats(BaseModel):
    hour: int
    total_time_seconds: float
    productive_time_seconds: float
    distracting_time_seconds: float
    neutral_time_seconds: float


class DailyUsageStats(BaseModel):
    date: str
    total_time_seconds: float
    productive_time_seconds: float
    distracting_time_seconds: float
    neutral_time_seconds: float


# 按应用分组的每小时使用统计响应模型
class HourlyAppUsageSummary(BaseModel):
    hour: str
    app_name: str
    duration_minutes: float
    productivity_type: ProductivityTypeEnum


# 插件相关模型

# 插件基础模型
class PluginBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    tags: Optional[List[str]] = None
    status: PluginStatus = PluginStatus.ACTIVE
    visibility: PluginVisibility = PluginVisibility.PRIVATE


# 创建插件请求模型
class PluginCreate(PluginBase):
    pass


# 更新插件请求模型
class PluginUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[PluginStatus] = None
    visibility: Optional[PluginVisibility] = None


# 插件版本基础模型
class PluginVersionBase(BaseModel):
    version: str
    changelog: Optional[str] = None
    min_app_version: Optional[str] = None
    dependencies: Optional[Dict[str, str]] = None


# 创建插件版本请求模型
class PluginVersionCreate(PluginVersionBase):
    pass


# 插件版本响应模型
class PluginVersionResponse(PluginVersionBase):
    id: int
    plugin_id: int
    zip_url: str
    zip_hash: str
    zip_size: int
    created_at: datetime
    is_latest: bool
    download_count: int

    class Config:
        orm_mode = True


# 插件响应模型
class PluginResponse(PluginBase):
    id: int
    created_at: datetime
    updated_at: datetime
    downloads_count: int
    versions: List[PluginVersionResponse] = []

    class Config:
        orm_mode = True


# 插件更新检查请求模型
class PluginUpdateCheckItem(BaseModel):
    pipe_id: str
    version: str


class PluginUpdateCheckRequest(BaseModel):
    plugins: List[PluginUpdateCheckItem]


# 插件更新检查响应项模型
class PluginUpdateCheckResultItem(BaseModel):
    pipe_id: str
    has_update: bool
    current_version: str
    latest_version: str
    latest_file_hash: Optional[str] = None
    latest_file_size: Optional[int] = None
    download_url: Optional[str] = None
    changelog: Optional[str] = None


# 插件更新检查响应模型
class PluginUpdateCheckResponse(BaseModel):
    results: List[PluginUpdateCheckResultItem]


# 用户API模型
class UserBase(BaseModel):
    email: EmailStr
    name: str
    avatar: Optional[str] = None
    # 设备信息 - 整合到用户模型中
    device_name: Optional[str] = None
    device_type: Optional[str] = None
    device_os: Optional[str] = None
    device_os_version: Optional[str] = None
    device_browser: Optional[str] = None
    device_browser_version: Optional[str] = None


class UserUpdate(UserBase):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    last_login_at: Optional[datetime] = None
    last_login_ip: Optional[str] = None
    device_name: Optional[str] = None
    device_type: Optional[str] = None
    device_os: Optional[str] = None
    device_os_version: Optional[str] = None
    device_browser: Optional[str] = None
    device_browser_version: Optional[str] = None


class UserInDB(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    last_login_ip: Optional[str] = None
    oauth_provider: Optional[str] = None
    oauth_id: Optional[str] = None
    device_last_active_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        # 确保不会尝试加载未加载的关系
        orm_mode = True
        arbitrary_types_allowed = True


# 设备信息模型 - 仅用于登录请求
class DeviceInfo(BaseModel):
    name: str
    device_type: str
    os: str
    os_version: Optional[str] = None
    browser: Optional[str] = None
    browser_version: Optional[str] = None
    ip_address: Optional[str] = None


# 邮箱登录请求
class EmailLoginRequest(BaseModel):
    email: EmailStr
    device_info: Optional[DeviceInfo] = None


# OAuth登录请求
class OAuthLoginRequest(BaseModel):
    provider: str  # "google", "github", etc.
    token: str
    device_info: Optional[DeviceInfo] = None


# 登录响应
class LoginResponse(BaseModel):
    user: UserInDB
    access_token: str
    token_type: str = "bearer"
    message: str = "登录成功"


# 令牌响应
class TokenResponse(BaseModel):
    success: bool
    message: str
    requires_verification: bool = False

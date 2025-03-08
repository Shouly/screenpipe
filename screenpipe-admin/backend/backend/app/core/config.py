import os
import logging
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# 配置日志
logger = logging.getLogger(__name__)

# 加载.env文件
load_dotenv()

class Settings(BaseSettings):
    # API配置
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Time Glass API"
    
    # Elasticsearch配置
    ES_URL: str = os.getenv("ES_URL", "http://es-sg-6l13oji530003k7jw.public.elasticsearch.aliyuncs.com:9200")
    ES_USER: str = os.getenv("ES_USER", "elastic")
    ES_PWD: str = os.getenv("ES_PWD", "TO&YhXowzIVC")
    
    # 索引配置
    ES_INDEX_PREFIX: str = "timeglass"
    
    # MySQL数据库配置
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "password")
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: str = os.getenv("MYSQL_PORT", "3306")
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "timeglass")
    MYSQL_DATABASE_URL: str = f"mysql+aiomysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
    
    # 定时任务配置
    ENABLE_SCHEDULED_TASKS: bool = os.getenv("ENABLE_SCHEDULED_TASKS", "True").lower() == "true"
    
    # WebSocket配置
    WEBSOCKET_PATH: str = "/ws"
    WEBSOCKET_AUTH_REQUIRED: bool = os.getenv("WEBSOCKET_AUTH_REQUIRED", "True").lower() == "true"
    WEBSOCKET_AUTH_TOKEN: str = os.getenv("WEBSOCKET_AUTH_TOKEN", "your-secret-token")
    WEBSOCKET_HEARTBEAT_INTERVAL: int = int(os.getenv("WEBSOCKET_HEARTBEAT_INTERVAL", "30"))  # 秒
    WEBSOCKET_CONNECTION_TIMEOUT: int = int(os.getenv("WEBSOCKET_CONNECTION_TIMEOUT", "60"))  # 秒
    
    # 其他配置
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # 插件配置
    PLUGIN_STORAGE_PATH: str = os.getenv("PLUGIN_STORAGE_PATH", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "storage", "plugins"))

settings = Settings()

# 打印配置信息，用于调试
logger.info(f"WebSocket认证配置: WEBSOCKET_AUTH_REQUIRED={settings.WEBSOCKET_AUTH_REQUIRED}")
logger.info(f"WebSocket认证令牌: WEBSOCKET_AUTH_TOKEN={settings.WEBSOCKET_AUTH_TOKEN}")
logger.info(f"环境变量值: {os.getenv('WEBSOCKET_AUTH_REQUIRED', '未设置')}") 
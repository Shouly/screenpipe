from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import asyncio

from .api.api import api_router
from .core.config import settings
from .db.elasticsearch import init_es, close_es
from .services.scheduled_tasks import schedule_tasks
from .services.remote_control_service import remote_control_service

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# 创建FastAPI应用
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for Time Glass application",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中，应该限制为前端应用的URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含API路由
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    """应用启动时执行的操作"""
    logger.info("Starting up Time Glass API")
    await init_es()
    
    # 启动远程控制服务
    await remote_control_service.start()
    logger.info("Remote control service started")
    
    # 启动定时任务
    if settings.ENABLE_SCHEDULED_TASKS:
        logger.info("Starting scheduled tasks")
        asyncio.create_task(schedule_tasks())
    
    # 打印所有路由，用于调试
    for route in app.routes:
        logger.info(f"路由: {route.path} [{', '.join(route.methods) if hasattr(route, 'methods') else 'WebSocket'}]")

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时执行的操作"""
    logger.info("Shutting down Time Glass API")
    
    # 停止远程控制服务
    await remote_control_service.stop()
    logger.info("Remote control service stopped")
    
    await close_es()

@app.get("/")
async def root():
    return {"message": "Welcome to Time Glass API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 
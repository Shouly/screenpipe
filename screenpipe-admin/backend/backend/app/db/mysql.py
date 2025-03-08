from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..core.config import settings

# 创建数据库URL
SQLALCHEMY_DATABASE_URL = settings.MYSQL_DATABASE_URL

# 创建异步数据库引擎
engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # 每次连接前ping一下，确保连接有效
    pool_recycle=3600,   # 一小时后回收连接
    echo=settings.DEBUG  # 调试模式下打印SQL语句
)

# 创建异步会话工厂
AsyncSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建Base类，所有模型都将继承这个类
Base = declarative_base()

# 获取异步数据库会话的依赖函数
async def get_db():
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close() 
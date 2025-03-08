import pytest
import os
import sys
from unittest.mock import AsyncMock, patch, MagicMock
import asyncio

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# 导入应用相关模块
from backend.app.db.elasticsearch import get_es_client

# 创建一个事件循环，用于异步测试
@pytest.fixture(scope="session")
def event_loop():
    """创建一个事件循环，用于异步测试"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# 模拟Elasticsearch客户端
@pytest.fixture
def mock_es_client():
    """模拟Elasticsearch客户端"""
    mock_client = MagicMock()
    
    # 模拟index方法
    mock_client.index = AsyncMock(return_value={"_id": "test-doc-id-12345", "result": "created"})
    
    # 模拟bulk方法
    mock_client.bulk = AsyncMock(return_value={"errors": False, "items": [{"index": {"_id": f"test-bulk-id-{i}", "result": "created"}} for i in range(5)]})
    
    # 模拟indices属性和方法
    mock_client.indices = MagicMock()
    mock_client.indices.exists = AsyncMock(return_value=True)
    mock_client.indices.create = AsyncMock(return_value={"acknowledged": True})
    
    return mock_client

# 替换get_es_client依赖
@pytest.fixture
def mock_get_es_client(mock_es_client):
    """替换get_es_client依赖"""
    with patch('backend.app.db.elasticsearch.get_es_client', return_value=mock_es_client):
        yield

# 模拟环境变量
@pytest.fixture(autouse=True)
def mock_env_vars():
    """模拟环境变量"""
    with patch.dict(os.environ, {
        "ES_URL": "http://mock-elasticsearch:9200",
        "ES_USER": "mock-user",
        "ES_PWD": "mock-password",
        "APP_ENV": "test",
        "DEBUG": "true",
        "API_PREFIX": "/api/v1"
    }):
        yield 
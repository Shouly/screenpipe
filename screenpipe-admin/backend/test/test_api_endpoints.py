import pytest
from fastapi.testclient import TestClient
import json
import os
import sys
from datetime import datetime, timedelta
import uuid
from unittest.mock import patch

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# 导入应用
from backend.app.main import app

# 创建测试客户端
client = TestClient(app)

def test_root_endpoint():
    """测试根端点"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Time Glass API"}

def test_health_check():
    """测试健康检查端点"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_api_docs():
    """测试API文档端点"""
    response = client.get("/api/v1/docs")
    assert response.status_code == 200
    assert "swagger" in response.text.lower()

def generate_test_data():
    """生成测试数据"""
    now = datetime.utcnow()
    
    return {
        "clientId": f"test-client-{uuid.uuid4()}",
        "timestamp": now.isoformat(),
        "reportType": "test",
        "dataVersion": "1.0",
        "data": {
            "frames": [
                {
                    "id": 1001,
                    "video_chunk_id": 501,
                    "offset_index": 120,
                    "timestamp": (now - timedelta(minutes=5)).isoformat(),
                    "name": "test-frame",
                    "browser_url": "https://example.com",
                    "ocr_text": {
                        "text": "This is a test OCR text",
                        "text_json": '{"lines":[{"text":"This is a test OCR text","bbox":[10,20,500,40]}]}',
                        "app_name": "TestBrowser",
                        "ocr_engine": "test-engine",
                        "window_name": "Test Window",
                        "focused": True,
                        "text_length": 24
                    }
                }
            ],
            "audioTranscriptions": [
                {
                    "id": 2001,
                    "audio_chunk_id": 301,
                    "offset_index": 45,
                    "timestamp": (now - timedelta(minutes=4)).isoformat(),
                    "transcription": "This is a test transcription",
                    "device": "Test Microphone",
                    "is_input_device": True,
                    "speaker_id": 1,
                    "transcription_engine": "test-engine",
                    "start_time": 0.0,
                    "end_time": 3.5,
                    "text_length": 28
                }
            ],
            "uiMonitoring": [
                {
                    "id": 3001,
                    "text_output": "Test UI element 1\nTest UI element 2",
                    "timestamp": (now - timedelta(minutes=3)).isoformat(),
                    "app": "TestApp",
                    "window": "Test Window",
                    "initial_traversal_at": (now - timedelta(minutes=3, seconds=5)).isoformat(),
                    "text_length": 36
                }
            ]
        },
        "metadata": {
            "appVersion": "0.1.0-test",
            "platform": "test-platform",
            "reportingPeriod": {
                "start": (now - timedelta(minutes=10)).isoformat(),
                "end": now.isoformat()
            },
            "systemInfo": {
                "os": "test-os",
                "osVersion": "1.0",
                "monitorCount": 1,
                "audioDeviceCount": 1,
                "applicationCount": 5,
                "hostname": "test-host"
            }
        }
    }

@pytest.mark.asyncio
async def test_data_report_api(mock_get_es_client):
    """测试数据报告API"""
    # 生成测试数据
    test_data = generate_test_data()
    
    # 发送POST请求
    response = client.post("/api/v1/data/report", json=test_data)
    
    # 检查响应
    assert response.status_code == 200
    
    # 验证响应内容
    response_data = response.json()
    assert response_data["status"] == "success"
    assert "Data report received and processed successfully" in response_data["message"]
    assert "report_id" in response_data
    assert "received_at" in response_data

@pytest.mark.asyncio
async def test_data_report_api_invalid_data():
    """测试数据报告API - 无效数据"""
    # 创建无效数据（缺少必要字段）
    invalid_data = {
        "clientId": "test-client",
        # 缺少其他必要字段
    }
    
    # 发送POST请求
    response = client.post("/api/v1/data/report", json=invalid_data)
    
    # 检查响应 - 应该返回422 Unprocessable Entity
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_data_report_api_server_error(mock_get_es_client):
    """测试数据报告API - 服务器错误"""
    # 生成测试数据
    test_data = generate_test_data()
    
    # 模拟Elasticsearch客户端抛出异常
    with patch('backend.app.services.data_service.DataService.store_report', 
               side_effect=Exception("Test server error")):
        
        # 发送POST请求
        response = client.post("/api/v1/data/report", json=test_data)
        
        # 检查响应 - 应该返回500 Internal Server Error
        assert response.status_code == 500
        assert "Error processing data report" in response.json()["detail"]

if __name__ == "__main__":
    # 运行测试
    pytest.main(["-xvs", __file__]) 
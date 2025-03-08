import pytest
import os
import sys
from datetime import datetime, timedelta
import uuid
import json
from unittest.mock import AsyncMock, patch, MagicMock

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# 导入应用相关模块
from backend.app.services.data_service import DataService
from backend.app.models.data import DataReport

def create_test_report():
    """创建测试报告数据"""
    now = datetime.utcnow()
    
    # 创建测试数据
    test_data = {
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
    
    # 转换为Pydantic模型
    return DataReport(**test_data)

class TestDataService:
    """DataService类的测试"""
    
    @pytest.mark.asyncio
    async def test_store_report(self):
        """测试存储报告功能"""
        # 创建模拟ES客户端
        mock_es_client = MagicMock()
        mock_es_client.index = AsyncMock(return_value={"_id": "test-doc-id-12345", "result": "created"})
        
        # 创建数据服务
        service = DataService(mock_es_client)
        
        # 创建测试报告
        report = create_test_report()
        
        # 模拟ensure_index_exists函数
        with patch('backend.app.db.elasticsearch.ensure_index_exists', AsyncMock(return_value=True)):
            # 调用存储报告方法
            report_id = await service.store_report(report)
            
            # 验证结果
            assert report_id is not None
            assert isinstance(report_id, str)
            assert len(report_id) > 0
            
            # 验证index方法被调用
            assert mock_es_client.index.called
    
    @pytest.mark.asyncio
    async def test_extract_and_store_specialized_data(self):
        """测试提取和存储专门数据功能"""
        # 创建模拟ES客户端
        mock_es_client = MagicMock()
        mock_es_client.bulk = AsyncMock(return_value={"errors": False})
        
        # 创建数据服务
        service = DataService(mock_es_client)
        
        # 创建测试报告
        report = create_test_report()
        report_id = "test-report-id-12345"
        
        # 模拟ensure_index_exists函数
        with patch('backend.app.db.elasticsearch.ensure_index_exists', AsyncMock(return_value=True)):
            # 调用提取和存储专门数据方法
            await service.extract_and_store_specialized_data(report, report_id)
            
            # 验证bulk方法被调用
            assert mock_es_client.bulk.called
            
            # 获取bulk方法的调用参数
            call_args = mock_es_client.bulk.call_args_list
            
            # 验证至少有一次调用
            assert len(call_args) > 0

if __name__ == "__main__":
    # 运行测试
    pytest.main(["-xvs", __file__]) 
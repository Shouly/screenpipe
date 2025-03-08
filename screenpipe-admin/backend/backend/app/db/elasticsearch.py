from elasticsearch import AsyncElasticsearch, NotFoundError
from ..core.config import settings
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# 创建异步ES客户端
es_client = AsyncElasticsearch(
    hosts=[settings.ES_URL],
    basic_auth=(settings.ES_USER, settings.ES_PWD),
    verify_certs=False  # 生产环境应设置为True并配置适当的证书
)

async def get_es_client() -> AsyncElasticsearch:
    """依赖注入函数，用于获取ES客户端"""
    return es_client

async def init_es():
    """初始化ES连接和索引"""
    try:
        # 检查连接
        info = await es_client.info()
        logger.info(f"Connected to Elasticsearch: {info['version']['number']}")
        
        # 创建索引模板
        await create_index_templates()
        
        # 创建专用索引
        await create_specialized_indices()
        
    except Exception as e:
        logger.error(f"Failed to connect to Elasticsearch: {e}")
        raise

async def close_es():
    """关闭ES连接"""
    await es_client.close()
    logger.info("Elasticsearch connection closed")

async def create_index_templates():
    """创建索引模板"""
    # 主数据模板
    template_name = f"{settings.ES_INDEX_PREFIX}-data-template"
    template_pattern = f"{settings.ES_INDEX_PREFIX}-data-*"
    
    # 检查模板是否存在
    template_exists = await es_client.indices.exists_index_template(name=template_name)
    
    if not template_exists:
        # 创建模板
        template_body = {
            "index_patterns": [template_pattern],
            "template": {
                "settings": {
                    "number_of_shards": 3,
                    "number_of_replicas": 1,
                    "refresh_interval": "30s"
                },
                "mappings": {
                    "properties": {
                        "clientId": {"type": "keyword"},
                        "timestamp": {"type": "date"},
                        "reportType": {"type": "keyword"},
                        "dataVersion": {"type": "keyword"},
                        "received_at": {"type": "date"},
                        "data": {
                            "properties": {
                                "frames": {
                                    "type": "nested",
                                    "properties": {
                                        "id": {"type": "long"},
                                        "video_chunk_id": {"type": "long"},
                                        "offset_index": {"type": "long"},
                                        "timestamp": {"type": "date"},
                                        "name": {"type": "keyword"},
                                        "browser_url": {"type": "keyword"},
                                        "ocr_text": {
                                            "properties": {
                                                "text": {"type": "text", "analyzer": "standard"},
                                                "text_json": {"type": "text", "index": False},
                                                "app_name": {"type": "keyword"},
                                                "ocr_engine": {"type": "keyword"},
                                                "window_name": {"type": "keyword"},
                                                "focused": {"type": "boolean"},
                                                "text_length": {"type": "integer"}
                                            }
                                        }
                                    }
                                },
                                "audioTranscriptions": {
                                    "type": "nested",
                                    "properties": {
                                        "id": {"type": "long"},
                                        "audio_chunk_id": {"type": "long"},
                                        "offset_index": {"type": "long"},
                                        "timestamp": {"type": "date"},
                                        "transcription": {"type": "text", "analyzer": "standard"},
                                        "device": {"type": "keyword"},
                                        "is_input_device": {"type": "boolean"},
                                        "speaker_id": {"type": "integer"},
                                        "transcription_engine": {"type": "keyword"},
                                        "start_time": {"type": "float"},
                                        "end_time": {"type": "float"},
                                        "text_length": {"type": "integer"}
                                    }
                                },
                                "uiMonitoring": {
                                    "type": "nested",
                                    "properties": {
                                        "id": {"type": "long"},
                                        "text_output": {"type": "text", "analyzer": "standard"},
                                        "timestamp": {"type": "date"},
                                        "app": {"type": "keyword"},
                                        "window": {"type": "keyword"},
                                        "initial_traversal_at": {"type": "date"},
                                        "text_length": {"type": "integer"}
                                    }
                                }
                            }
                        },
                        "metadata": {
                            "properties": {
                                "appVersion": {"type": "keyword"},
                                "platform": {"type": "keyword"},
                                "reportingPeriod": {
                                    "properties": {
                                        "start": {"type": "date"},
                                        "end": {"type": "date"}
                                    }
                                },
                                "systemInfo": {
                                    "properties": {
                                        "os": {"type": "keyword"},
                                        "osVersion": {"type": "keyword"},
                                        "monitorCount": {"type": "integer"},
                                        "audioDeviceCount": {"type": "integer"},
                                        "applicationCount": {"type": "integer"},
                                        "hostname": {"type": "keyword"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        await es_client.indices.put_index_template(name=template_name, body=template_body)
        logger.info(f"Created index template: {template_name}")
    else:
        logger.info(f"Index template already exists: {template_name}")

async def create_specialized_indices():
    """创建专用索引"""
    # 创建OCR文本索引
    await create_index_if_not_exists(f"{settings.ES_INDEX_PREFIX}-ocr-text", {
        "mappings": {
            "properties": {
                "report_id": {"type": "keyword"},
                "client_id": {"type": "keyword"},
                "timestamp": {"type": "date"},
                "frame_id": {"type": "long"},
                "text": {"type": "text", "analyzer": "standard"},
                "app_name": {"type": "keyword"},
                "window_name": {"type": "keyword"},
                "focused": {"type": "boolean"},
                "text_length": {"type": "integer"},
                "extracted_at": {"type": "date"},
                # 元数据字段
                "app_version": {"type": "keyword"},
                "platform": {"type": "keyword"},
                "reporting_period_start": {"type": "date"},
                "reporting_period_end": {"type": "date"},
                "os": {"type": "keyword"},
                "os_version": {"type": "keyword"},
                "hostname": {"type": "keyword"}
            }
        }
    })
    
    # 创建音频转录索引
    await create_index_if_not_exists(f"{settings.ES_INDEX_PREFIX}-audio-transcriptions", {
        "mappings": {
            "properties": {
                "report_id": {"type": "keyword"},
                "client_id": {"type": "keyword"},
                "timestamp": {"type": "date"},
                "transcription_id": {"type": "long"},
                "transcription": {"type": "text", "analyzer": "standard"},
                "device": {"type": "keyword"},
                "is_input_device": {"type": "boolean"},
                "speaker_id": {"type": "integer"},
                "start_time": {"type": "float"},
                "end_time": {"type": "float"},
                "text_length": {"type": "integer"},
                "extracted_at": {"type": "date"},
                # 元数据字段
                "app_version": {"type": "keyword"},
                "platform": {"type": "keyword"},
                "reporting_period_start": {"type": "date"},
                "reporting_period_end": {"type": "date"},
                "os": {"type": "keyword"},
                "os_version": {"type": "keyword"},
                "hostname": {"type": "keyword"}
            }
        }
    })
    
    # 创建UI监控索引
    await create_index_if_not_exists(f"{settings.ES_INDEX_PREFIX}-ui-monitoring", {
        "mappings": {
            "properties": {
                "report_id": {"type": "keyword"},
                "client_id": {"type": "keyword"},
                "timestamp": {"type": "date"},
                "monitoring_id": {"type": "long"},
                "text_output": {"type": "text", "analyzer": "standard"},
                "app": {"type": "keyword"},
                "window": {"type": "keyword"},
                "initial_traversal_at": {"type": "date"},
                "text_length": {"type": "integer"},
                "extracted_at": {"type": "date"},
                # 元数据字段
                "app_version": {"type": "keyword"},
                "platform": {"type": "keyword"},
                "reporting_period_start": {"type": "date"},
                "reporting_period_end": {"type": "date"},
                "os": {"type": "keyword"},
                "os_version": {"type": "keyword"},
                "hostname": {"type": "keyword"}
            }
        }
    })
    
    # 创建当天的数据索引
    today_index = f"{settings.ES_INDEX_PREFIX}-data-{datetime.utcnow().strftime('%Y.%m.%d')}"
    await create_index_if_not_exists(today_index)

async def create_index_if_not_exists(index_name, body=None):
    """如果索引不存在，则创建索引"""
    try:
        exists = await es_client.indices.exists(index=index_name)
        if not exists:
            if body:
                await es_client.indices.create(index=index_name, body=body)
            else:
                await es_client.indices.create(index=index_name)
            logger.info(f"Created index: {index_name}")
        else:
            logger.info(f"Index already exists: {index_name}")
    except Exception as e:
        logger.error(f"Error creating index {index_name}: {e}")
        # 在生产环境中，可能需要更好地处理这个错误

async def ensure_index_exists(index_name):
    """确保索引存在，如果不存在则创建"""
    try:
        exists = await es_client.indices.exists(index=index_name)
        if not exists:
            await es_client.indices.create(index=index_name)
            logger.info(f"Created index: {index_name}")
        return True
    except Exception as e:
        logger.error(f"Error ensuring index {index_name} exists: {e}")
        return False 
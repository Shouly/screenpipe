import asyncio
import logging
import uuid
from datetime import datetime

from elasticsearch import AsyncElasticsearch, NotFoundError

from ..core.config import settings
from ..db.elasticsearch import ensure_index_exists
from ..models.data import DataReport

logger = logging.getLogger(__name__)


class DataService:
    def __init__(self, es_client: AsyncElasticsearch):
        self.es_client = es_client

    async def extract_and_store_specialized_data(
        self, report: DataReport, report_id: str
    ):
        """
        提取并存储专门数据

        Args:
            report: 数据报告对象
            report_id: 报告ID
        """
        try:
            # 提取OCR文本
            await self._extract_ocr_text(report, report_id)

            # 提取音频转录
            await self._extract_audio_transcriptions(report, report_id)

            # 提取UI监控数据
            await self._extract_ui_monitoring(report, report_id)

        except Exception as e:
            logger.error(f"Error extracting specialized data: {e}")
            # 这里的错误不应该影响主流程，所以我们只记录错误

    async def _extract_ocr_text(self, report: DataReport, report_id: str):
        """提取OCR文本到专用索引"""
        ocr_docs = []

        for frame in report.data.frames:
            if hasattr(frame, "ocr_text") and frame.ocr_text:
                ocr_doc = {
                    "report_id": report_id,
                    "client_id": report.clientId,
                    "timestamp": frame.timestamp.isoformat(),
                    "frame_id": frame.id,
                    "text": frame.ocr_text.text,
                    "app_name": frame.app_name if hasattr(frame, "app_name") else "",
                    "window_name": (
                        frame.window_name
                        if hasattr(frame, "window_name")
                        and frame.window_name is not None
                        else ""
                    ),
                    "focused": frame.focused if hasattr(frame, "focused") else False,
                    "text_length": (
                        frame.ocr_text.text_length
                        if hasattr(frame.ocr_text, "text_length")
                        and frame.ocr_text.text_length is not None
                        else len(frame.ocr_text.text)
                    ),
                    "extracted_at": datetime.utcnow().isoformat(),
                    # 添加元数据信息
                    "app_version": report.metadata.appVersion,
                    "platform": report.metadata.platform,
                    "reporting_period_start": report.metadata.reportingPeriod.start.isoformat(),
                    "reporting_period_end": report.metadata.reportingPeriod.end.isoformat(),
                    "os": report.metadata.systemInfo.os,
                    "os_version": report.metadata.systemInfo.osVersion,
                    "hostname": report.metadata.systemInfo.hostname,
                }
                ocr_docs.append(ocr_doc)

        if ocr_docs:
            # 确保索引存在
            ocr_index = f"{settings.ES_INDEX_PREFIX}-ocr-text"
            await ensure_index_exists(ocr_index)

            # 批量索引
            operations = []
            for doc in ocr_docs:
                operations.append({"index": {"_index": ocr_index}})
                operations.append(doc)

            await self.es_client.bulk(operations=operations)
            logger.info(f"Extracted {len(ocr_docs)} OCR text documents")

    async def _extract_audio_transcriptions(self, report: DataReport, report_id: str):
        """提取音频转录到专用索引"""
        audio_docs = []

        for transcription in report.data.audioTranscriptions:
            audio_doc = {
                "report_id": report_id,
                "client_id": report.clientId,
                "timestamp": transcription.timestamp.isoformat(),
                "transcription_id": transcription.id,
                "transcription": transcription.transcription,
                "device": transcription.device,
                "is_input_device": transcription.is_input_device,
                "speaker_id": transcription.speaker_id,
                "start_time": transcription.start_time,
                "end_time": transcription.end_time,
                "text_length": (
                    transcription.text_length
                    if transcription.text_length is not None
                    else 0
                ),
                "extracted_at": datetime.utcnow().isoformat(),
                # 添加元数据信息
                "app_version": report.metadata.appVersion,
                "platform": report.metadata.platform,
                "reporting_period_start": report.metadata.reportingPeriod.start.isoformat(),
                "reporting_period_end": report.metadata.reportingPeriod.end.isoformat(),
                "os": report.metadata.systemInfo.os,
                "os_version": report.metadata.systemInfo.osVersion,
                "hostname": report.metadata.systemInfo.hostname,
            }
            audio_docs.append(audio_doc)

        if audio_docs:
            # 确保索引存在
            audio_index = f"{settings.ES_INDEX_PREFIX}-audio-transcriptions"
            await ensure_index_exists(audio_index)

            # 批量索引
            operations = []
            for doc in audio_docs:
                operations.append({"index": {"_index": audio_index}})
                operations.append(doc)

            await self.es_client.bulk(operations=operations)
            logger.info(f"Extracted {len(audio_docs)} audio transcription documents")

    async def _extract_ui_monitoring(self, report: DataReport, report_id: str):
        """提取UI监控数据到专用索引"""
        ui_docs = []

        for ui_item in report.data.uiMonitoring:
            ui_doc = {
                "report_id": report_id,
                "client_id": report.clientId,
                "timestamp": ui_item.timestamp.isoformat(),
                "monitoring_id": ui_item.id,
                "text_output": ui_item.text_output,
                "app": ui_item.app,
                "window": ui_item.window,
                "initial_traversal_at": ui_item.initial_traversal_at.isoformat(),
                "text_length": (
                    ui_item.text_length if ui_item.text_length is not None else 0
                ),
                "extracted_at": datetime.utcnow().isoformat(),
                # 添加元数据信息
                "app_version": report.metadata.appVersion,
                "platform": report.metadata.platform,
                "reporting_period_start": report.metadata.reportingPeriod.start.isoformat(),
                "reporting_period_end": report.metadata.reportingPeriod.end.isoformat(),
                "os": report.metadata.systemInfo.os,
                "os_version": report.metadata.systemInfo.osVersion,
                "hostname": report.metadata.systemInfo.hostname,
            }
            ui_docs.append(ui_doc)

        if ui_docs:
            # 确保索引存在
            ui_index = f"{settings.ES_INDEX_PREFIX}-ui-monitoring"
            await ensure_index_exists(ui_index)

            # 批量索引
            operations = []
            for doc in ui_docs:
                operations.append({"index": {"_index": ui_index}})
                operations.append(doc)

            await self.es_client.bulk(operations=operations)
            logger.info(f"Extracted {len(ui_docs)} UI monitoring documents")

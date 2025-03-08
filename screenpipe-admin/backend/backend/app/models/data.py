from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# OCR文本模型
class OcrText(BaseModel):
    text: str
    text_json: str
    app_name: str
    ocr_engine: str
    window_name: Optional[str] = None
    focused: bool
    text_length: Optional[int] = Field(default=0)

# 屏幕帧模型
class Frame(BaseModel):
    id: int
    video_chunk_id: int
    offset_index: int
    timestamp: datetime
    name: str
    browser_url: Optional[str] = None
    ocr_text: OcrText

# 音频转录模型
class AudioTranscription(BaseModel):
    id: int
    audio_chunk_id: int
    offset_index: int
    timestamp: datetime
    transcription: str
    device: str
    is_input_device: bool
    speaker_id: int
    transcription_engine: str
    start_time: float
    end_time: float
    text_length: Optional[int] = Field(default=0)

# UI监控模型
class UiMonitoring(BaseModel):
    id: int
    text_output: str
    timestamp: datetime
    app: str
    window: str
    initial_traversal_at: datetime
    text_length: Optional[int] = Field(default=0)

# 数据载荷模型
class DataPayload(BaseModel):
    frames: List[Frame]
    audioTranscriptions: List[AudioTranscription]
    uiMonitoring: List[UiMonitoring]

# 报告周期模型
class ReportingPeriod(BaseModel):
    start: datetime
    end: datetime

# 系统信息模型
class SystemInfo(BaseModel):
    os: str
    osVersion: str
    monitorCount: int
    audioDeviceCount: int
    applicationCount: int
    hostname: str

# 元数据模型
class Metadata(BaseModel):
    appVersion: str
    platform: str
    reportingPeriod: ReportingPeriod
    systemInfo: SystemInfo

# 数据报告模型
class DataReport(BaseModel):
    clientId: str
    timestamp: datetime
    reportType: str
    dataVersion: str
    data: DataPayload
    metadata: Metadata

# 响应模型
class DataReportResponse(BaseModel):
    status: str
    message: str
    received_at: datetime
    report_id: Optional[str] = None 
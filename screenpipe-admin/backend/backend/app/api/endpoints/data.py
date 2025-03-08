import logging
import uuid
from datetime import datetime, timedelta

from elasticsearch import AsyncElasticsearch
from fastapi import APIRouter, Depends, HTTPException

from ...db.elasticsearch import get_es_client
from ...db.mysql import get_db
from ...models.data import DataReport, DataReportResponse
from ...services.data_service import DataService
from ...services.usage_analysis_service import UsageAnalysisService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/report", response_model=DataReportResponse)
async def report_data(
    report: DataReport, es_client: AsyncElasticsearch = Depends(get_es_client)
):
    """
    接收并存储客户端数据报告
    """
    try:
        # 创建数据服务
        data_service = DataService(es_client)

        # 异步处理专门数据
        report_id = str(uuid.uuid4())
        await data_service.extract_and_store_specialized_data(report, report_id)

        # 返回成功响应
        return DataReportResponse(
            status="success",
            message="Data report received and processed successfully",
            received_at=datetime.utcnow() + timedelta(hours=8),
            report_id=report_id,
        )

    except Exception as e:
        logger.error(f"Error processing data report: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error processing data report: {e}"
        )

from pydantic import BaseModel
from .report import ReportRead
from .claim import ClaimRead

class ClaimReportBase(BaseModel):
    report_id: int
    claim_id: int

class ClaimReportCreate(ClaimReportBase):
    pass

class ClaimReportRead(ClaimReportBase):
    report: ReportRead
    claim: ClaimRead

    class Config:
        from_attributes = True

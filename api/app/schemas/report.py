from pydantic import BaseModel
from datetime import datetime
from .user import UserPublic
from typing import Optional

class ReportBase(BaseModel):
    title: str
    report_message: str

class ReportCreate(ReportBase):
    post_id: Optional[int] = None
    claim_id: Optional[int] = None

    class Config:
        from_attributes = True

class ReportRead(ReportBase):
    id: int
    time_created: datetime
    report_status: str
    user: UserPublic | None  # because of ON DELETE SET NULL

    class Config:
        from_attributes = True

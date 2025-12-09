from pydantic import BaseModel
from .report import ReportRead
from .post import PostRead

class PostReportBase(BaseModel):
    report_id: int
    post_id: int

class PostReportCreate(PostReportBase):
    pass

class PostReportRead(PostReportBase):
    report: ReportRead
    post: PostRead

    class Config:
        from_attributes = True

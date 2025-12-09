from pydantic import BaseModel
from datetime import datetime
from .user import UserPublic

class AuditLogBase(BaseModel):
    actions: str
    log_detail: str
    target_type: str
    target_id: int

class AuditLogCreate(AuditLogBase):
    usr_id: int | None = None

class AuditLogRead(AuditLogBase):
    id: int
    time_created: datetime
    user: UserPublic | None  # since ON DELETE SET NULL

    class Config:
        from_attributes = True

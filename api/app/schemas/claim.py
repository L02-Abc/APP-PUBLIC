from pydantic import BaseModel
from datetime import datetime
from .user import UserPublic
from .post import PostRead
from typing import Optional

class ClaimBase(BaseModel):
    claim_description: str
    contact_info: str

class ClaimCreate(ClaimBase):
    post_id: int

    class Config:
        from_attributes = True

class ClaimUpdate(ClaimCreate):
    claim_description: Optional[str] = None
    contact_info: Optional[str] = None

class ClaimDisplay(ClaimBase):
    id: int
    usr_id: int
    post_id: int
    updated_at: datetime

    class Config:
        from_attributes = True

class ClaimRead(ClaimBase):
    id: int
    time_created: datetime
    updated_at: datetime
    post: PostRead
    user: UserPublic

    class Config:
        from_attributes = True

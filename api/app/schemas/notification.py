from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from .user import UserPublic

class NotificationBase(BaseModel):
    title: str
    noti_message: str

class NotificationCreate(NotificationBase):
    usr_id: int
    post_id: int
    #link_to_newpost: Optional[str] = None

    class Config:
        from_attributes = True

class NotificationRead(NotificationBase):
    id: int
    time_created: datetime
    is_read: bool
    link_to_newpost: Optional[str] = Field(default=None)
    user: UserPublic

    class Config:
        from_attributes = True

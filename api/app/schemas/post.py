from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from .user import UserPublic
from .thread import ThreadRead

class PostImageBase(BaseModel):
    url: str

    model_config = ConfigDict(from_attributes=True)

class PostBase(BaseModel):
    id: int
    title: str
    building: str
    post_floor: str
    nearest_room: str
    found_at: datetime = Field(default_factory=datetime.now())
    post_description: str
    usr_id: int
    thread_id: int
    post_status: str
    model_config = ConfigDict(from_attributes=True)

class PostCreate(PostBase):
    images: List[PostImageBase] = []
    
    model_config = ConfigDict(from_attributes=True)

class PostUpdate(BaseModel):
    post_status: Optional[str] = None
    post_description: Optional[str] = None

class PostRead(PostBase):
    id: int
    post_status: str
    time_created: datetime
    found_at: datetime
    updated_at: datetime
    thread: ThreadRead
    user: UserPublic

    class Config:
        from_attributes = True

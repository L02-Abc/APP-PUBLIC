from pydantic import BaseModel, ConfigDict

class FollowBase(BaseModel):
    pass

class FollowCreate(FollowBase):
    thread_id: int

class FollowGet(FollowBase):
    usr_id: int
    thread_id: int

    model_config = ConfigDict(from_attributes=True)

class FollowRead(FollowBase):
    class Config:
        from_attributes = True

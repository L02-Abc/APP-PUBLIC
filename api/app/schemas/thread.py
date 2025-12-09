from pydantic import BaseModel

class ThreadBase(BaseModel):
    thread_name: str

class ThreadCreate(ThreadBase):
    pass

class ThreadRead(ThreadBase):
    id: int

    class Config:
        from_attributes = True

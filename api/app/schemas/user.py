from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime
from typing import List
from app.schemas.follow import FollowGet

class UserBase(BaseModel):
    pass

class UserPublic(UserBase):
    id: int
    alias: str
    followed_threads: List[FollowGet] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class UserId(UserBase):
    id: int

class UserDisplay(BaseModel):
    alias: str
    email: str    
    model_config = ConfigDict(from_attributes=True)
#Request OTP
class UserRequestOTP(BaseModel):
    email: str

#Verify OTP
class UserVerifyOTP(BaseModel):
    email: str
    otp_code: str

class RegisterDeviceToken(BaseModel):
    device_push_token: str

#Read (admin use)
class UserRead(UserBase):
    id: int
    email: str
    role: str
    time_created: datetime

    class Config:
        from_attributes = True

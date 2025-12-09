import random, string
from fastapi import APIRouter, Depends, HTTPException
from redis.asyncio.client import Redis
from app.core.dependencies import get_db, get_settings, get_redis_client
from app.schemas import UserRequestOTP, UserVerifyOTP
from app.services.auth import send_otp, verify_otp
from app.utils.utils import commit_to_db
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

router = APIRouter (prefix="/auth", tags=["Auth"])

@router.post("/request-otp")
async def request_otp (
    data: UserRequestOTP, 
    redis_client: Redis = Depends(get_redis_client),
    settings: dict = Depends(get_settings),
    session: AsyncSession = Depends(get_db)
):
    data.email += settings["EMAIL_POSTFIX"]
    result = await session.execute(select(User).where(User.email == data.email)) 
    result = result.scalar_one_or_none() 
    if not result:
        new_user = User(
            email = data.email,
            alias = 'user#'+ ''.join(random.choices(string.digits, k=5)),
            role = 'user'
        )
        session.add(new_user)
        await commit_to_db(session)
        await session.refresh(new_user)

    try:
        await send_otp(data.email, redis_client, settings)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to send OTP")
    
    return {"email": data.email, "message": "OTP sent"}


@router.post("/verify-otp")
async def app_verify_otp (
    data: UserVerifyOTP, 
    redis_client: Redis = Depends(get_redis_client),
    settings: dict = Depends(get_settings)
):
    data.email += settings["EMAIL_POSTFIX"]
    try:
        token = await verify_otp(data.email,  data.otp_code, redis_client, settings)
    except Exception:
        raise HTTPException(status_code=400, detail="OTP invalid or expired")
    return {"access_token": token, "token_type": "bearer"}
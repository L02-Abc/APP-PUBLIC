import os, redis.asyncio as redis
from dotenv import load_dotenv
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt, ExpiredSignatureError
from app.models.user import User

load_dotenv()

oauth2_scheme = HTTPBearer()

def get_settings():
    return {
        "DATABASE_URL": os.getenv("DATABASE_URL"),
        "REDIS_URL": os.getenv("REDIS_URL"),
        "RESEND_API_KEY": os.getenv("RESEND_API_KEY"),
        "CLOUDINARY_CLOUD_NAME": os.getenv("CLOUDINARY_CLOUD_NAME"),
        "CLOUDINARY_API_KEY": os.getenv("CLOUDINARY_API_KEY"),
        "CLOUDINARY_API_SECRET": os.getenv("CLOUDINARY_API_SECRET"),
        "CLOUDINARY_URL": os.getenv("CLOUDINARY_URL"),
        "EMAIL_POSTFIX": os.getenv("EMAIL_POSTFIX"),
        "ALGO": os.getenv("ALGO"),
        "SEC_KEY": os.getenv("SEC_KEY"),
        "ACCESS_TOKEN_EXPIRE_MINUTES": int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
    }
    
engine = create_async_engine(os.getenv("DATABASE_URL"))
AsyncSessionLocal = async_sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def get_redis_client():
    redis_client = redis.from_url (
        os.getenv("REDIS_URL"),
        encoding="utf-8",
        decode_responses=True,  
    )
    try:
        yield redis_client 
    finally:
        await redis_client.close()

async def get_current_user(
    session: AsyncSession = Depends(get_db), 
    #redis_client: Redis = Depends(get_redis_client),
    token: HTTPAuthorizationCredentials = Depends(oauth2_scheme), 
    settings: dict = Depends(get_settings)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token=token.credentials, key=settings["SEC_KEY"], algorithms=[settings["ALGO"]])
        user_email: str = payload.get("sub")
        if user_email is None:
            raise credentials_exception
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError:
        raise credentials_exception

    # cached_user = await redis_client.hgetall(f"user:{user_email}")
    # if cached_user:
    #     return User(**cached_user)
    
    result = await session.execute(select(User).where(User.email == user_email))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception

    # await redis_client.hsetex(f"user:{user_email}", mapping=user.to_dict(), ex=30)
    return user

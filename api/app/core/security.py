from fastapi import Depends
from jose import jwt
from datetime import datetime, timedelta, UTC
from app.core.dependencies import get_settings

#pwd_context = CryptContext(schemes=["bcrypt"], DeprecationWarning="auto")

# def hash_password(password: str) -> str:
#     return pwd_context.hash(password)

# def verify_password(plain: str, hased: str) -> bool:
#     return pwd_context.verify(plain, hased)

def create_access_token(data: dict, settings: dict = Depends(get_settings)):
    encoded = data.copy()
    expire = datetime.now(UTC)+timedelta(minutes=settings["ACCESS_TOKEN_EXPIRE_MINUTES"])
    encoded.update({"exp": expire})
    return jwt.encode(encoded, key=settings["SEC_KEY"], algorithm=settings["ALGO"])
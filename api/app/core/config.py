import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = 'postgresql+psycopg2://postgres:postgres@localhost:5432/demo'
SEC_KEY = os.getenv("SEC_KEY", "keysieucap")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60*24*7))
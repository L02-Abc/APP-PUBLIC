from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from models import User, Post

#ĐÂY LÀ NƠI ĐỂ TEST CONNECTION VÀ CÁC MODELS
#CHUYỂN DIRECTORY TỚI app/ RỒI CHẠY BẰNG LỆNH: python -m core.database

DATABASE_URL = 'postgresql+psycopg2://postgres:postgres@localhost:5432/demo'
engine = create_engine(DATABASE_URL, echo=True)
print("connected")
SessionLocal = sessionmaker(expire_on_commit=False, autoflush=False, bind=engine)

with Session(engine) as session:
#INSERT NEW USER HAY LÀ GÌ ĐÓ CŨNG DC ĐỂ TEST

    # new_user = User (
    #     email = "email@gmail.com",
    #     alias = "User#1000",
    #     role = "user"
    # )
    # session.add(new_user)
    # session.commit()
    session.add()
    user = session.query(User).first()
    if user: #NẾU CÓ TỒN TẠI USER
        print(f"Found user: {user.email}")
    else: #CHƯA CÓ USER NÀO DC ADD, NMA ĐÃ CONNECT DC
        print("No users found, but models are connected correctly")

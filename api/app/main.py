from fastapi import FastAPI
from app.routes import auth, user, post, others

app = FastAPI()

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(post.router)
app.include_router(others.router)

@app.get("/")
async def root():
    return {"message": "bruh"}


from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.core.dependencies import get_db, get_current_user
from app.models.user import UserDevice, User
from app.models.follow import Follow
from app.models.post import Post
from app.schemas.user import UserPublic, RegisterDeviceToken, UserDisplay, UserId
from app.schemas.post import PostCreate
from app.schemas.follow import FollowCreate
from app.utils.utils import commit_to_db, get_post_byid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List

router = APIRouter(prefix="/user", tags=["User"])

@router.get("/me", response_model=UserPublic)
async def get_me (current_user = Depends(get_current_user)):
    return UserPublic.model_validate(current_user)

@router.post("/infoById", response_model=UserDisplay)
async def get_info_by_id (
    data: UserId,
    session: AsyncSession = Depends(get_db)
    ):
    result = await session.execute (
        select(User).where(User.id == data.id)
    )
    result = result.scalar_one_or_none()
    return UserDisplay.model_validate(result)

@router.get("/me/posts", response_model=List[PostCreate])
async def get_my_posts(
    session: AsyncSession = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    post_id = await session.execute(select(Post.id).where(current_user.id == Post.usr_id))
    post_id = post_id.scalars().all()
    my_posts: List[PostCreate] = []
    if len(post_id) != 0:
        for pid in post_id:
            post = await get_post_byid(pid, session, False) 
            if post:
                my_posts.append(post)
    else:
        raise HTTPException(status_code=404, detail="User has no post yet")

    return my_posts


@router.post("/device-token")
async def register_device (
    data: RegisterDeviceToken, 
    session: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await session.execute (
        select(UserDevice).where(UserDevice.device_push_token == data.device_push_token)
    )
    result = result.scalar_one_or_none()
    if result is None:
        new_device = UserDevice (
            device_push_token = data.device_push_token,
            usr_id = current_user.id
        )
        session.add(new_device)
        await commit_to_db(session)
        await session.refresh(new_device)
    else:
        return {"message": "Device already registered"}

    return {"message": "Device registered successfully"}



@router.post("/follows", response_model=dict)
async def follow (
    data: FollowCreate, 
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await session.execute (
        select(Follow).where(and_(Follow.usr_id == current_user.id, Follow.thread_id == data.thread_id))
    )
    result = result.scalar_one_or_none()
    if result is None:
        new_follow = Follow (
            usr_id = current_user.id,
            thread_id = data.thread_id
        )
        session.add(new_follow)
        await commit_to_db(session)
        await session.refresh(new_follow)
    else:
        raise HTTPException(status_code=400, detail="Already followed")
    
    #background_tasks.add_task(register_device_token(token, current_user, session))
    return {"message": f"User {current_user.alias} followed thread {data.thread_id}"}


@router.delete("/unfollows", response_model=dict)
async def unfollow (
    data: FollowCreate, 
    session: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
    
):
    result = await session.execute (
        select(Follow).where(and_(Follow.usr_id == current_user.id, Follow.thread_id == data.thread_id))
    )
    followed = result.scalar_one_or_none()
    if followed is None:
        raise HTTPException(status_code=404, detail="Follow not found")
   
    await session.delete(followed)
    await commit_to_db(session)
    return {"message": f"Unfollowed thread {followed.thread_id}"}


import json, hashlib
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Form, UploadFile, File
from redis.asyncio.client import Redis
from datetime import datetime
from app.core.dependencies import get_db, get_settings, get_current_user, get_redis_client
from app.models.user import User
from app.models.post import Post, PostImage
from app.models.claim import Claim
from app.schemas.post import PostCreate
from app.schemas.claim import ClaimCreate, ClaimUpdate, ClaimDisplay
from app.utils.utils import commit_to_db, get_post_byid, filt, paginate, update_post_status
from app.services.push_notification import notify_followers, notify_reporter, notify_claimer
from app.services.upload_images import upload_images
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from typing import List, Optional

router = APIRouter(prefix="/post", tags=["Post"])

@router.post("/create-post", response_model=PostCreate)
async def create_post(
    #data: PostBase, 
    background_tasks: BackgroundTasks, 
    title: str = Form(...),
    building: str = Form(...),
    post_floor: str = Form(...),
    nearest_room: str = Form(...),
    found_at: datetime = Form(default_factory=datetime.now()),
    post_description: str = Form(...),
    thread_id: int = Form(...),
    image_files: List[UploadFile] = File(...),
    session: AsyncSession = Depends(get_db),
    settings: dict = Depends(get_settings),
    current_user: User = Depends(get_current_user)
):
    
    new_post = Post(
        title = title,
        building = building,
        post_floor = post_floor,
        nearest_room = nearest_room,
        found_at = found_at,
        post_description = post_description,
        usr_id = current_user.id,
        thread_id = thread_id,
    )
    session.add(new_post)
    await commit_to_db(session)
    await session.refresh(new_post)
    await upload_images(image_files, settings, new_post.id)
    #uploaded_images = [PostImage(post_id = new_post.id, url = imgurl) for imgurl in urls]    
    #new_post.images = uploaded_images
    #await commit_to_db(session)
    await session.refresh(new_post)
    background_tasks.add_task(notify_followers, new_post.thread_id, new_post.id)
    return PostCreate.model_validate(new_post)

@router.patch("/update-post/{post_id}", response_model=PostCreate)
async def update_post(
    post_id: int,
    title: Optional[str] = Form(None),
    building: Optional[str] = Form(None),
    post_floor: Optional[str] = Form(None),
    nearest_room: Optional[str] = Form(None),
    post_description: Optional[str] = Form(None),
    image_files: Optional[List[UploadFile]] = File(None),
    session: AsyncSession = Depends(get_db),
    settings: dict = Depends(get_settings),
    current_user: User = Depends(get_current_user)
):
    data = await session.execute(select(Post).where(Post.id == post_id))
    post = data.scalar_one_or_none()
    if post is None:
        raise HTTPException(status_code=404, detail="Post id not found")
    else:
        if current_user.id != post.usr_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
    
    if title:
        post.title = title
    if building:
        post.building = building
    if post_floor:
        post.post_floor = post_floor
    if nearest_room:
        post.nearest_room = nearest_room
    if post_description:
        post.post_description = post_description
    
    await commit_to_db(session)
    await session.refresh(post)
    if image_files:
        images = await session.execute(delete(PostImage).where(PostImage.post_id == post_id))
        await commit_to_db(session)
        await session.refresh(post)
        await upload_images(image_files, settings, post.id)
    #uploaded_images = [PostImage(post_id = new_post.id, url = imgurl) for imgurl in urls]    
    #new_post.images = uploaded_images
    #await commit_to_db(session)
    await session.refresh(post)
    return PostCreate.model_validate(post)

@router.get("/get-post-details/{post_id}", response_model=PostCreate)
async def get_post_details(post_id: int, session: AsyncSession = Depends(get_db)):
    post_detail = await get_post_byid(post_id, session)
    return post_detail


@router.patch("/soft-delete-post/{post_id}")
async def soft_delete_post(
    post_id: int,
    session: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    await update_post_status(post_id, "DELETED", session, current_user)
    


@router.post("/dashboard", response_model=dict)
async def list_posts(
    req: dict,
    archived: bool = Query(False),
    refresh: bool = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=20),
    session: AsyncSession = Depends(get_db),
    redis_client: Redis = Depends(get_redis_client),
):
    #tạo unique key từ filter
    filterkey = hashlib.md5(json.dumps(req, sort_keys=True).encode()).hexdigest()
    cache_key = f"dasboard:{archived}:{filterkey}:{page}:{limit}"
    if refresh == False:
        cached_posts = await redis_client.get(cache_key)
        if cached_posts:
            #print("cached from redis heheheheh")
            return json.loads(cached_posts)
    

    filters = filt(Post, req[next(iter(req))])
    if not archived:
        query = select(Post).where(Post.post_status.not_in(["DELETED", "ARCHIVED"]), *filters)
    else:
        query = select(Post).where(Post.post_status.not_in(["DELETED", "OPEN"]), *filters)
    res = await paginate(session, query, page, limit, Post)
    posts = [PostCreate.model_validate(post).model_dump() for post in res["items"]]
    
    response = {"page": page, "total": res["total"], "posts": posts}
    await redis_client.setex(cache_key, 120, json.dumps(response, default=str))
    return response

@router.get("/{post_id}/claims/me", response_model=Optional[ClaimCreate])
async def get_my_claim(
    post_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    res = await session.execute(
        select(Claim)
        .join(Post, Claim.post_id == Post.id)
        .where(and_(Claim.usr_id == current_user.id), (Post.id == post_id))
    )
    claim = res.scalar_one_or_none()
    if claim is None:
        return None
    return ClaimCreate.model_validate(claim)

@router.post("/{post_id}/submit-claim")
async def submit_claim(
    data: ClaimCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    res = await session.execute(
        select(Claim)
        .join(Post, Claim.post_id == Post.id)
        .join(User, User.id == Post.usr_id)
        .where(and_(User.id == current_user.id), (Post.id == data.post_id))
    )
    claim = res.scalar_one_or_none()

    if claim:
        raise HTTPException(status_code=400, detail="Already made a claim for this item")
    
    new_claim = Claim(
        claim_description = data.claim_description,
        contact_info = data.contact_info,
        usr_id = current_user.id,
        post_id = data.post_id
    )
    session.add(new_claim)
    await commit_to_db(session)
    await session.refresh(new_claim)
    background_tasks.add_task(notify_reporter, new_claim.post_id)
   #return ClaimCreate.model_validate(new_claim)


@router.patch("/{post_id}/update-claim", response_model=ClaimCreate)
async def update_claim(
    data: ClaimUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    res = await session.execute(
        select(Claim)
        .join(Post, Claim.post_id == Post.id)
        
        .where(and_(Claim.usr_id == current_user.id), (Post.id == data.post_id))
    )
    claim = res.scalar_one_or_none()
    if claim is None:
        raise HTTPException(status_code=404, detail="Claim not found")
    else:
        if current_user.id != claim.usr_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
    
    if data.claim_description:
        claim.claim_description = data.claim_description    
    if data.contact_info:
        claim.contact_info = data.contact_info
    
    await commit_to_db(session)
    await session.refresh(claim)
    return ClaimCreate.model_validate(claim)



@router.get("/{post_id}/claims", response_model=List[ClaimDisplay])
async def view_claims(
    post_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await session.execute(select(Post.usr_id).where(Post.id == post_id))
    usr_id = res.scalar_one_or_none()
    if usr_id != current_user.id or usr_id is None:
        raise HTTPException(status_code=403, detail="Only reporter of this post can view claims")
    results = await session.execute(select(Claim).where(Claim.post_id == post_id))
    results = results.scalars().all()
    claims = [ClaimDisplay.model_validate(claim) for claim in results]
    return claims


@router.patch("/{claim_id}/validate-claim", response_model=dict)
async def validate_claim(
    post_id: int,
    claim_id: int,
    decision: str,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    if decision == "accepted":
        await update_post_status(post_id, "ARCHIVED", session, current_user)
        background_tasks.add_task(notify_claimer, post_id, claim_id, decision)
        return {"message": f"Claim with id {claim_id} for post # {post_id} was accepted"}
    else:
        background_tasks.add_task(notify_claimer, post_id, claim_id, decision)
        return {"message": f"Claim with id {claim_id} for post # {post_id} was rejected"}
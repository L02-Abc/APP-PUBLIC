from sqlalchemy import select, and_, func, cast, String
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import  AsyncSession
from fastapi import HTTPException, status, Query
from app.models.user import User
from app.models.post import Post, PostImage
from app.models.claim import Claim
from app.models.notification import Notification
from app.schemas.post import PostCreate, PostImageBase
from sqlalchemy.sql.sqltypes import Date, DateTime
import datetime

async def update_post_status(post_id: int, status: str, session: AsyncSession, current_user: User):
    data = await session.execute(select(Post).where(Post.id == post_id))
    post = data.scalar_one_or_none()
    if post is None:
        raise HTTPException(status_code=404, detail="Post id not found")
    else:
        if current_user.id != post.usr_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

    post.post_status = status
    await commit_to_db(session)
    await session.refresh(post)
    
    return {"message": f"Updated post with id {post_id} to {status}"}

async def update_claim_status(claim_id: int, status: str,  session: AsyncSession, current_user: User ):
    data = await session.execute(select(Claim).where(Claim.id == claim_id))
    claim = data.scalar_one_or_none()
    if claim is None:
        raise HTTPException(status_code=404, detail="Claim id not found")
        
    claim.claim_status = status
    await commit_to_db(session)
    await session.refresh(claim)
    return {"message": f"Updated claim with id {claim_id} to {status}"}

async def commit_to_db(session: AsyncSession):
    try:
        await session.commit()
    except IntegrityError as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=f"Integrity error: {e.orig}")
    except SQLAlchemyError as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


async def get_post_byid(
    post_id: int, 
    session: AsyncSession,
    raise_flag: bool = True
) -> PostCreate | None:
    data = await session.execute(
        select(Post)
        .where(and_(Post.id == post_id, Post.post_status.not_in(["DELETED"])))
    )
    data = data.scalar_one_or_none()
    if data:        
        post_data = {
            "id": data.id,
            "title": data.title,
            "building": data.building,
            "images": [PostImageBase(url=img.url) for img in data.images],
            "post_floor": data.post_floor,
            "nearest_room": data.nearest_room,
            "found_at": data.found_at,
            "post_description": data.post_description,
            "usr_id": data.usr_id,
            "thread_id": data.thread_id,
            "post_status": data.post_status or "OPEN",
        }
        return PostCreate(**post_data)
    else:
        if raise_flag:
            raise HTTPException(status_code=404, detail="Post not found")    
        return None


async def paginate(session: AsyncSession, query, page: int, limit: int, model):
    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar()
    offset = (page-1)*limit
    paginated = query.order_by(model.time_created.desc()).offset(offset).limit(limit)
    res = await session.execute(paginated)
    res = res.scalars().all()
    total = min(total, limit)
    
    return {"page": page, "limit": limit, "total": total, "items": res}


def filt(model, requirements: dict):
    res = []
    for key, value in requirements.items():
        if value is None:
            continue

        column = getattr(model, key)
        
        try:
            python_type = column.type.python_type
        except NotImplementedError:
            python_type = None
        if python_type and issubclass(python_type, (datetime.datetime, datetime.date)):
            if isinstance(value, str):
                try:
                    value = datetime.datetime.fromisoformat(value.replace("Z", "+00:00"))
                except ValueError:
                    
                    continue

            res.append(column >= value)

        elif python_type is str and isinstance(value, str):
            res.append(column.ilike(f"%{value}%"))

        else:
            res.append(column == value)

    return res
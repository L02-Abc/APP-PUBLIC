from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.dependencies import get_db, get_current_user
from app.utils.utils import commit_to_db, paginate
from app.models.user import User
from app.models.post import Post
from app.models.report import Report
from app.models.notification import Notification
from app.schemas.report import ReportCreate, ReportRead
from app.schemas.notification import NotificationCreate, NotificationRead
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import List

router = APIRouter(prefix="/others", tags=["Others"])

@router.post("/report/send-report", response_model=ReportCreate)
async def send_report(
    data: ReportCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.post_id:
        new_report = Report(
            title = data.title,
            report_message = data.report_message,
            usr_id = current_user.id,
            post_id = data.post_id
        )
        session.add(new_report)
        await commit_to_db(session)
        await session.refresh(new_report)
    if data.claim_id:
        res = await session.execute(select(Post.usr_id).where(Post.id == data.post_id))
        usr_id = res.scalar_one_or_none()
        if usr_id != current_user.id or usr_id is None:
            raise HTTPException(status_code=403, detail="Only reporter of this post can report claims")
        new_report = Report(
            title = data.title,
            report_message = data.report_message,
            usr_id = current_user.id,
            claim_id = data.claim_id
        )
        session.add(new_report)
        await commit_to_db(session)
        await session.refresh(new_report)
    return ReportCreate.model_validate(new_report)


@router.get("/report/list-reports", response_model=List[ReportRead])
async def list_report(
    start_date: datetime,
    end_date: datetime,
    session: AsyncSession = Depends(get_db)
):
    result = await session.execute(
        select(Report)
        .options(selectinload(Report.user))
        .where(
            and_(
                Report.time_created >= start_date,
                Report.time_created <= end_date
            )
        )
    )
    reports = result.scalars().all()
    return [ReportRead.model_validate(report) for report in reports]


@router.get("/notifications/list-notifications", response_model=List[NotificationRead])
async def list_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    query = select(Notification).where(Notification.usr_id == current_user.id)
    result = await paginate(session, query, page, limit, Notification)
    notifs = [NotificationRead.model_validate(notif) for notif in result["items"]]
    return notifs
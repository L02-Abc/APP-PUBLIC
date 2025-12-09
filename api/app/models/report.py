import datetime
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Text, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (
        CheckConstraint(
            "NUM_NONNULLS(post_id, claim_id) = 1",
            name="CK_report_target"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    time_created: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    report_message: Mapped[str] = mapped_column(Text, nullable=False)
    report_status: Mapped[str] = mapped_column(String(50), default="UNRESOLVED")
    
    usr_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    post_id: Mapped[Optional[int]] = mapped_column(ForeignKey("posts.id", ondelete="RESTRICT"))
    claim_id: Mapped[Optional[int]] = mapped_column(ForeignKey("claims.id", ondelete="RESTRICT"), unique=True)


    user: Mapped["User"] = relationship(back_populates="reports")
    post: Mapped[Optional["Post"]] = relationship(back_populates="reports", cascade="all, delete")
    claim: Mapped[Optional["Claim"]] = relationship(back_populates="report", cascade="all, delete")

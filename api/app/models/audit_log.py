import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, func, UniqueConstraint, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    time_created: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actions: Mapped[str] = mapped_column(String(255), nullable=False)
    log_detail: Mapped[str] = mapped_column(Text, nullable=False)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[int] = mapped_column(nullable=False)

    usr_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)

    user: Mapped["User"] = relationship(back_populates="audit_logs")


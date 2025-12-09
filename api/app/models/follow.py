from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class Follow(Base):
    __tablename__ = "follow"
    __table_args__ = (UniqueConstraint("usr_id", "thread_id", name="uq_user_thread_follow"),)

    usr_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    thread_id: Mapped[int] = mapped_column(ForeignKey("threads.id", ondelete="CASCADE"), primary_key=True)

    user: Mapped["User"] = relationship(back_populates="followed_threads", lazy="selectin")
    thread: Mapped["Thread"] = relationship(back_populates="follows", lazy="selectin")


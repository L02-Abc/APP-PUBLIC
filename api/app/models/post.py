import datetime
from typing import List
from sqlalchemy import String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    time_created: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    building: Mapped[str] = mapped_column(String(2), nullable=False)
    post_floor: Mapped[str] = mapped_column(String(2), nullable=False)
    nearest_room: Mapped[str] = mapped_column(String(3), nullable=False)
    found_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    post_description: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    post_status: Mapped[str] = mapped_column(String(20), default="OPEN")

    usr_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    thread_id: Mapped[int] = mapped_column(ForeignKey("threads.id", ondelete="RESTRICT"), nullable=False)

    user: Mapped["User"] = relationship(back_populates="posts", lazy="selectin")
    thread: Mapped["Thread"] = relationship(back_populates="posts", lazy="selectin")
    images: Mapped[List["PostImage"]] = relationship(back_populates="post", cascade="all, delete", lazy="selectin")
    claims: Mapped[List["Claim"]] = relationship(back_populates="post", cascade="all, delete", lazy="selectin")
    notifications: Mapped[List["Notification"]] = relationship(back_populates="post", cascade="all, delete", lazy="selectin")
    reports: Mapped[List["Report"]] = relationship(back_populates="post", cascade="all, delete-orphan", lazy="selectin")


class PostImage(Base):
    __tablename__ = "post_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"))
    url: Mapped[str] = mapped_column(String(255), nullable=False)

    post: Mapped["Post"] = relationship(back_populates="images", lazy="selectin")



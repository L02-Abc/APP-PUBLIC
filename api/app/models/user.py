import datetime
from typing import List, Optional
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    time_created: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    alias: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)

    posts: Mapped[List["Post"]] = relationship(back_populates="user", cascade="all, delete", lazy="selectin")
    claims: Mapped[List["Claim"]] = relationship(back_populates="user", cascade="all, delete", lazy="selectin")
    notifications: Mapped[List["Notification"]] = relationship(back_populates="user", cascade="all, delete", lazy="selectin")
    reports: Mapped[List["Report"]] = relationship(back_populates="user", cascade="all, delete", lazy="selectin")
    audit_logs: Mapped[List["AuditLog"]] = relationship(back_populates="user", cascade="all, delete", lazy="selectin")
    followed_threads: Mapped[List["Follow"]] = relationship(back_populates="user", cascade="all, delete", lazy="selectin")
    user_devices: Mapped[List["UserDevice"]] = relationship(back_populates="user", cascade="all, delete", lazy="selectin")


class UserDevice(Base):
    __tablename__ = "user_devices"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    device_push_token: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    platform: Mapped[str] = mapped_column(String(255), nullable=True)  # 'ios', 'android'
    last_seen: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    usr_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    user: Mapped["User"] = relationship(back_populates="user_devices", lazy="selectin")


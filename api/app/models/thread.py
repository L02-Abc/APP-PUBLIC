from typing import List
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class Thread(Base):
    __tablename__ = "threads"

    id: Mapped[int] = mapped_column(primary_key=True,autoincrement=True)
    thread_name: Mapped[str] = mapped_column(String(2), unique=True, nullable=False)

    follows: Mapped[List["Follow"]] = relationship(back_populates="thread", cascade="all, delete", lazy="selectin")
    posts: Mapped[List["Post"]] = relationship(back_populates="thread", cascade="all, delete", lazy="selectin")

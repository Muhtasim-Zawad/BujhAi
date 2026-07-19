import datetime

from sqlalchemy import String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    badge: Mapped[str] = mapped_column(String, default="New")
    button_text: Mapped[str] = mapped_column(String, default="Open Project")
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        server_default=func.datetime("now")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        server_default=func.datetime("now"), onupdate=func.datetime("now")
    )

    modules = relationship("Module", back_populates="project", cascade="all, delete-orphan")
    materials = relationship("Material", back_populates="project", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="project", cascade="all, delete-orphan")
    canvas_scenes = relationship("CanvasScene", back_populates="project", cascade="all, delete-orphan")
    resources = relationship("Resource", back_populates="project", cascade="all, delete-orphan")

import datetime

from sqlalchemy import Boolean, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Rubric(Base):
    __tablename__ = "rubrics"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    project_id: Mapped[str] = mapped_column(
        String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime.datetime] = mapped_column(
        server_default=func.datetime("now")
    )

    project = relationship("Project", back_populates="rubrics")
    points = relationship("RubricPoint", back_populates="rubric", cascade="all, delete-orphan")


class RubricPoint(Base):
    __tablename__ = "rubric_points"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    rubric_id: Mapped[str] = mapped_column(
        String, ForeignKey("rubrics.id", ondelete="CASCADE"), nullable=False
    )
    text: Mapped[str] = mapped_column(String, nullable=False)
    checked: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    rubric = relationship("Rubric", back_populates="points")

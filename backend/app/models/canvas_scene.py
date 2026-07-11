import datetime

from sqlalchemy import ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CanvasScene(Base):
    __tablename__ = "canvas_scenes"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    project_id: Mapped[str] = mapped_column(
        String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    scene_data: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        server_default=func.datetime("now")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        server_default=func.datetime("now"), onupdate=func.datetime("now")
    )

    project = relationship("Project", back_populates="canvas_scenes")

import datetime

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserPointProgress(Base):
    __tablename__ = "user_point_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "point_id", name="uq_user_point_progress"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    point_id: Mapped[str] = mapped_column(
        String, ForeignKey("module_points.id", ondelete="CASCADE"), nullable=False
    )
    checked: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="point_progress")
    point = relationship("ModulePoint")

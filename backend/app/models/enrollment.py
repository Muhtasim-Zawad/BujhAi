import datetime

from sqlalchemy import ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ProjectEnrollment(Base):
    __tablename__ = "project_enrollments"
    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_project_enrollment"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True)
    project_id: Mapped[str] = mapped_column(
        String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        server_default=func.now()
    )

    project = relationship("Project", back_populates="enrollments")
    user = relationship("User", back_populates="enrollments")

"""add completed_at to project_enrollments

Revision ID: 003
Revises: 002
Create Date: 2026-07-25
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "project_enrollments",
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("project_enrollments", "completed_at")

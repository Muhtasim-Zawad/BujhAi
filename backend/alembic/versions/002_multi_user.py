"""add multi-user collaboration tables

Revision ID: 002
Revises: 001
Create Date: 2026-07-24
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "projects",
        sa.Column("join_code", sa.String(), nullable=True, unique=True),
    )
    op.create_index("ix_projects_join_code", "projects", ["join_code"])

    op.add_column(
        "messages",
        sa.Column("user_id", sa.String(), nullable=True),
    )
    op.create_foreign_key(
        "fk_messages_user_id",
        "messages", "users",
        ["user_id"], ["id"],
        ondelete="CASCADE",
    )

    op.add_column(
        "canvas_scenes",
        sa.Column("user_id", sa.String(), nullable=True),
    )
    op.create_foreign_key(
        "fk_canvas_scenes_user_id",
        "canvas_scenes", "users",
        ["user_id"], ["id"],
        ondelete="CASCADE",
    )

    op.create_table(
        "project_enrollments",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("project_id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("project_id", "user_id", name="uq_project_enrollment"),
    )

    op.create_table(
        "user_point_progress",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("point_id", sa.String(), nullable=False),
        sa.Column("checked", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["point_id"], ["module_points.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "point_id", name="uq_user_point_progress"),
    )


def downgrade() -> None:
    op.drop_table("user_point_progress")
    op.drop_table("project_enrollments")
    op.drop_constraint("fk_canvas_scenes_user_id", "canvas_scenes", type_="foreignkey")
    op.drop_column("canvas_scenes", "user_id")
    op.drop_constraint("fk_messages_user_id", "messages", type_="foreignkey")
    op.drop_column("messages", "user_id")
    op.drop_index("ix_projects_join_code", table_name="projects")
    op.drop_column("projects", "join_code")

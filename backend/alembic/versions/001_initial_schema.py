"""Initial schema for CM Kerala Grievance Portal

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-11-11 15:54:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "departments",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_table(
        "contact_enquiries",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("mobile", sa.String(length=20), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("department_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "grievances",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("reference_id", sa.String(length=30), nullable=False),
        sa.Column("citizen_id", sa.String(), nullable=False),
        sa.Column("district", sa.String(length=100), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("priority", sa.String(length=10), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("assigned_dept_id", sa.String(), nullable=True),
        sa.Column("ai_summary", sa.Text(), nullable=True),
        sa.Column("ai_category", sa.String(length=100), nullable=True),
        sa.Column("ai_priority", sa.String(length=10), nullable=True),
        sa.Column("ai_department", sa.String(length=100), nullable=True),
        sa.Column("is_duplicate_risk", sa.Boolean(), nullable=True),
        sa.Column("is_escalated", sa.Boolean(), nullable=True),
        sa.Column("escalated_at", sa.DateTime(), nullable=True),
        sa.Column("cmo_remarks", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["assigned_dept_id"], ["departments.id"]),
        sa.ForeignKeyConstraint(["citizen_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_grievances_reference_id"), "grievances", ["reference_id"], unique=True
    )

    op.create_table(
        "attachments",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("grievance_id", sa.String(), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("file_type", sa.String(length=100), nullable=False),
        sa.Column("uploaded_by_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["grievance_id"], ["grievances.id"]),
        sa.ForeignKeyConstraint(["uploaded_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "citizen_feedback",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("grievance_id", sa.String(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["grievance_id"], ["grievances.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("grievance_id"),
    )
    op.create_table(
        "department_assignments",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("grievance_id", sa.String(), nullable=False),
        sa.Column("department_id", sa.String(), nullable=False),
        sa.Column("assigned_by_id", sa.String(), nullable=False),
        sa.Column("assigned_at", sa.DateTime(), nullable=True),
        sa.Column("action_report", sa.Text(), nullable=True),
        sa.Column("resolution_details", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["assigned_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"]),
        sa.ForeignKeyConstraint(["grievance_id"], ["grievances.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "grievance_history",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("grievance_id", sa.String(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("changed_by_id", sa.String(), nullable=False),
        sa.Column("changed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["changed_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["grievance_id"], ["grievances.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("grievance_history")
    op.drop_table("department_assignments")
    op.drop_table("citizen_feedback")
    op.drop_table("attachments")
    op.drop_index(op.f("ix_grievances_reference_id"), table_name="grievances")
    op.drop_table("grievances")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    op.drop_table("contact_enquiries")
    op.drop_table("departments")

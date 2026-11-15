"""
SQLAlchemy ORM model for Leave Requests.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    request_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    employee_code: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    employee_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category_code: Mapped[str] = mapped_column(String(20), nullable=False)
    category_name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_date: Mapped[str] = mapped_column(String(20), nullable=False)
    end_date: Mapped[str] = mapped_column(String(20), nullable=False)
    duration_days: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    is_half_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="PENDING_APPROVAL", nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    handover_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    applied_on: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    approver_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    approver_comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    actioned_on: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self):
        return f"<LeaveRequest {self.request_number} {self.employee_code} ({self.status})>"

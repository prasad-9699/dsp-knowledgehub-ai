"""
SQLAlchemy ORM model for Expense and Reimbursement Claims.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ExpenseClaim(Base):
    __tablename__ = "expense_claims"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    claim_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    employee_code: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    employee_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    category_label: Mapped[str] = mapped_column(String(100), nullable=False)
    expense_date: Mapped[str] = mapped_column(String(20), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    merchant: Mapped[str] = mapped_column(String(255), nullable=False)
    business_purpose: Mapped[str] = mapped_column(Text, nullable=False)
    receipt_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    receipt_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="SUBMITTED", nullable=False)
    submitted_on: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    approver_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reviewer_comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    actioned_on: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    settlement_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
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
        return f"<ExpenseClaim {self.claim_number} {self.employee_code} INR {self.amount} ({self.status})>"

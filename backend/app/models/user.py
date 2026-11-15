"""
User model with role-based access control.

Supports both DSP employee accounts (ADMIN, INVESTMENT_ANALYST, ADVISOR,
RESEARCH, RISK, COMPLIANCE) and viewer-only accounts.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    """
    Platform user account.

    In the Advisor Copilot architecture, users are DSP employees
    who manage client relationships and investment decisions.
    """

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # RBAC role
    role: Mapped[str] = mapped_column(
        Enum(
            # Core self-service employee roles
            "EMPLOYEE", "MANAGER", "ADMIN", "COMPLIANCE", "HR",
            # Investment & research roles
            "INVESTMENT_ANALYST", "ADVISOR", "RESEARCH", "RISK", "VIEWER",
            # Legacy roles (kept for backward compatibility)
            "INVESTOR", "ANALYST", "PORTFOLIO_MANAGER", "RESEARCHER",
            name="user_role",
        ),
        default="EMPLOYEE",
        nullable=False,
    )

    # ─── Employee-specific fields ────────────────────────────────────
    employee_code: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    designation: Mapped[str | None] = mapped_column(String(100), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Metadata
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
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
        return f"<User {self.email} ({self.role})>"

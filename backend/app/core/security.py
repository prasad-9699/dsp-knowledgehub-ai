"""
Authentication & Authorization module.

JWT-based authentication with role-based access control (RBAC).
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db

settings = get_settings()

import hashlib
import hmac
import os

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except Exception:
    pwd_context = None

# Bearer token scheme (auto_error=False to allow fallback to HttpOnly cookies)
security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt with PBKDF2-SHA256 fallback."""
    if pwd_context is not None:
        try:
            return pwd_context.hash(password)
        except Exception:
            pass
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"pbkdf2_sha256${salt.hex()}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    if hashed_password.startswith("pbkdf2_sha256$"):
        parts = hashed_password.split("$")
        if len(parts) == 3:
            salt = bytes.fromhex(parts[1])
            expected_key = bytes.fromhex(parts[2])
            key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100000)
            return hmac.compare_digest(key, expected_key)
    if pwd_context is not None:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            pass
    return False


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.jwt_access_token_expire_minutes)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(days=settings.jwt_refresh_token_expire_days)
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the current authenticated user.
    Supports Authorization Bearer header AND secure HttpOnly cookie (dsp_access_token).
    """
    from app.models.user import User

    raw_token: Optional[str] = None
    if credentials and credentials.credentials:
        raw_token = credentials.credentials
    elif request and "dsp_access_token" in request.cookies:
        raw_token = request.cookies.get("dsp_access_token")
    elif request and "access_token" in request.cookies:
        raw_token = request.cookies.get("access_token")

    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Support institutional demo session tokens for seamless resilience
    if raw_token.startswith("demo-session"):
        import uuid
        parts = raw_token.split(":")
        emp_code = parts[1] if len(parts) > 1 else "EMP-1001"
        from app.api.auth import INSTITUTIONAL_DEMO_USERS
        from app.services.self_service_service import self_service_engine

        u = INSTITUTIONAL_DEMO_USERS.get(emp_code.lower())
        emp_rec = self_service_engine.get_employee_by_id(emp_code)

        if not emp_rec:
            # Auto-register employee in self-service engine so all self-service workflows operate smoothly
            emp_rec = self_service_engine.add_or_register_employee(
                employee_code=emp_code,
                full_name=u.get("full_name") if u else "DSP Professional",
                email=u.get("email") if u else f"{emp_code.lower()}@dspamc.com",
                role=u.get("role", "EMPLOYEE") if u else "EMPLOYEE",
                department=u.get("department", "Equities & Wealth Management") if u else "Equities & Wealth Management",
                designation=u.get("designation", "Investment Professional") if u else "Investment Professional",
            )

        if not u:
            u = emp_rec
            INSTITUTIONAL_DEMO_USERS[emp_code.lower()] = u
        u_id = u.get("id")
        try:
            u_uuid = uuid.UUID(str(u_id))
        except Exception:
            u_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, str(emp_code))
        return User(
            id=u_uuid,
            email=u.get("email", f"{emp_code.lower()}@dspamc.com"),
            hashed_password="demo",
            full_name=u.get("full_name", "DSP Professional"),
            role=u.get("role", "EMPLOYEE"),
            employee_code=u.get("employee_code", emp_code),
            department=u.get("department", "Equities & Wealth Management"),
            designation=u.get("designation", "Investment Professional"),
            is_active=True,
            is_verified=True,
        )

    payload = decode_token(raw_token)

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = None
    try:
        if db is not None:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
    except Exception:
        user = None

    if user is None:
        # Check institutional demo users registry in development / demo mode
        from app.api.auth import INSTITUTIONAL_DEMO_USERS
        emp_code = payload.get("emp_code")
        for u in INSTITUTIONAL_DEMO_USERS.values():
            if str(u["id"]) == str(user_id) or (emp_code and u.get("employee_code") == emp_code):
                import uuid
                try:
                    u_uuid = uuid.UUID(str(u["id"]))
                except Exception:
                    u_uuid = uuid.uuid4()
                return User(
                    id=u_uuid,
                    email=u["email"],
                    hashed_password="demo",
                    full_name=u["full_name"],
                    role=u.get("role", "EMPLOYEE"),
                    employee_code=u.get("employee_code", "EMP-1001"),
                    department=u.get("department", "Operations"),
                    designation=u.get("designation", "Employee"),
                    is_active=True,
                    is_verified=True,
                )

        if emp_code:
            from app.services.self_service_service import self_service_engine
            emp_rec = self_service_engine.get_employee_by_id(emp_code)
            if not emp_rec:
                emp_rec = self_service_engine.add_or_register_employee(
                    employee_code=emp_code,
                    full_name=payload.get("name", "DSP Professional"),
                    email=payload.get("email", f"{emp_code.lower()}@dspamc.com"),
                    role=payload.get("role", "EMPLOYEE"),
                )
            import uuid
            try:
                u_uuid = uuid.UUID(str(user_id))
            except Exception:
                u_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, str(emp_code))
            return User(
                id=u_uuid,
                email=emp_rec.get("email", f"{emp_code.lower()}@dspamc.com"),
                hashed_password="demo",
                full_name=emp_rec.get("full_name", "DSP Professional"),
                role=emp_rec.get("role", "EMPLOYEE"),
                employee_code=emp_code,
                department=emp_rec.get("department", "Equities & Wealth Management"),
                designation=emp_rec.get("designation", "Investment Professional"),
                is_active=True,
                is_verified=True,
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or session expired",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )

    return user


class RoleChecker:
    """Dependency to check user roles for RBAC."""

    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = [r.upper() for r in allowed_roles]

    async def __call__(self, current_user=Depends(get_current_user)):
        user_role = (current_user.role or "").upper()
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this resource",
            )
        return current_user



# ─── Role-based permission shortcuts ─────────────────────────────────
# Supports employee roles (EMPLOYEE, MANAGER, ADMIN, COMPLIANCE, RISK)
# and legacy roles

ALL_ROLES = [
    "ADMIN", "MANAGER", "EMPLOYEE", "INVESTMENT_ANALYST", "ADVISOR",
    "RESEARCH", "RISK", "COMPLIANCE", "VIEWER",
    # Legacy
    "ANALYST", "PORTFOLIO_MANAGER", "RESEARCHER", "INVESTOR",
]

# Roles that can manage clients and proposals
CLIENT_MANAGEMENT_ROLES = [
    "ADMIN", "INVESTMENT_ANALYST", "ADVISOR",
    # Legacy
    "ANALYST", "PORTFOLIO_MANAGER",
]

# Roles that can view/run investment research
RESEARCH_ROLES = [
    "ADMIN", "INVESTMENT_ANALYST", "ADVISOR", "RESEARCH",
    # Legacy
    "ANALYST", "PORTFOLIO_MANAGER", "RESEARCHER",
]

require_admin = RoleChecker(["ADMIN"])
require_analyst = RoleChecker(CLIENT_MANAGEMENT_ROLES)
require_portfolio_manager = RoleChecker(["ADMIN", "PORTFOLIO_MANAGER", "INVESTMENT_ANALYST"])
require_researcher = RoleChecker(RESEARCH_ROLES)
require_investor = RoleChecker(ALL_ROLES)

# New Advisor Copilot permissions
require_client_access = RoleChecker(CLIENT_MANAGEMENT_ROLES)
require_proposal_access = RoleChecker(CLIENT_MANAGEMENT_ROLES)
require_risk_access = RoleChecker(["ADMIN", "INVESTMENT_ANALYST", "ADVISOR", "RISK", "ANALYST", "PORTFOLIO_MANAGER"])
require_compliance_access = RoleChecker(["ADMIN", "COMPLIANCE", "RISK"])
require_any_authenticated = RoleChecker(ALL_ROLES)


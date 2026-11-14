"""
Authentication API endpoints.
"""

from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.core.config import get_settings
from app.models.user import User
from app.schemas.schemas import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    APIResponse,
    ResponseMetadata,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


@router.post("/register", response_model=APIResponse)
async def register(
    request: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new employee/user in DSP KnowledgeHub AI.
    Works seamlessly in both managed PostgreSQL production and safe in-memory demo mode.
    """
    from app.services.self_service_service import self_service_engine

    email_clean = request.email.strip().lower()
    full_name_clean = request.full_name.strip()
    role_clean = request.role.strip().upper() if request.role else "EMPLOYEE"

    valid_roles = ["EMPLOYEE", "MANAGER", "ADMIN", "COMPLIANCE", "INVESTOR", "ANALYST", "PORTFOLIO_MANAGER", "RESEARCHER"]
    if role_clean not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be one of: EMPLOYEE, MANAGER, ADMIN, COMPLIANCE",
        )

    # Determine or generate employee code
    if request.employee_code and request.employee_code.strip():
        emp_code = request.employee_code.strip().upper()
    else:
        # Auto-generate next sequential employee code
        existing_numbers = []
        for key in INSTITUTIONAL_DEMO_USERS.keys():
            if key.startswith("emp-"):
                try:
                    num_part = int(key.split("-")[1])
                    if num_part < 2000:
                        existing_numbers.append(num_part)
                except Exception:
                    pass
        next_num = max(existing_numbers, default=1005) + 1
        emp_code = f"EMP-{next_num}"

    user_id = str(uuid.uuid4())
    user_created = None

    # 1. Try DB insertion if database is online
    if db is not None:
        try:
            result = await db.execute(
                select(User).where((User.email == email_clean) | (User.employee_code == emp_code))
            )
            existing_user = result.scalar_one_or_none()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Employee with this email or employee ID already exists",
                )

            db_user = User(
                id=uuid.UUID(user_id),
                email=email_clean,
                hashed_password=hash_password(request.password),
                full_name=full_name_clean,
                role=role_clean,
                employee_code=emp_code,
                department=request.department or "Equities & Wealth Management",
                designation=request.designation or "Investment Professional",
                is_active=True,
                is_verified=True,
            )
            db.add(db_user)
            await db.flush()
            user_created = db_user
        except HTTPException:
            raise
        except Exception:
            user_created = None

    # 2. Check for duplicate in demo registry if DB was offline
    if not user_created:
        if email_clean in INSTITUTIONAL_DEMO_USERS or emp_code.lower() in INSTITUTIONAL_DEMO_USERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with Employee ID {emp_code} or email {email_clean} already registered",
            )

    new_demo_entry = {
        "id": user_id,
        "employee_code": emp_code,
        "email": email_clean,
        "password": request.password,
        "full_name": full_name_clean,
        "department": request.department or "Equities & Wealth Management",
        "designation": request.designation or "Investment Professional",
        "role": role_clean,
        "is_active": True,
    }
    INSTITUTIONAL_DEMO_USERS[emp_code.lower()] = new_demo_entry
    INSTITUTIONAL_DEMO_USERS[email_clean] = new_demo_entry

    # Register in self_service_engine
    self_service_engine.add_or_register_employee(
        employee_code=emp_code,
        full_name=full_name_clean,
        email=email_clean,
        role=role_clean,
        department=request.department or "Equities & Wealth Management",
        designation=request.designation or "Investment Professional",
    )

    # Generate JWT Tokens
    token_data = {"sub": user_id, "role": role_clean, "emp_code": emp_code}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Set secure session cookie
    response.set_cookie(
        key="dsp_access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=settings.jwt_access_token_expire_minutes * 60,
        path="/",
    )

    return APIResponse(
        success=True,
        data={
            "user": {
                "id": user_id,
                "employee_code": emp_code,
                "email": email_clean,
                "full_name": full_name_clean,
                "role": role_clean,
                "department": request.department or "Equities & Wealth Management",
                "designation": request.designation or "Investment Professional",
            },
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": settings.jwt_access_token_expire_minutes * 60,
            },
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="auth_registration",
            data_status="USER_CREATED",
            is_demo=settings.is_demo,
        ),
    )


# ─── Institutional Demo Accounts ──────────────────────────────────────
INSTITUTIONAL_DEMO_USERS = {
    "emp-1001": {
        "id": "11111111-1111-1111-1111-111111111111",
        "employee_code": "EMP-1001",
        "email": "aditi.sharma@dspamc.com",
        "password": "Password@123",
        "full_name": "Aditi Sharma",
        "department": "Equities & Wealth Management",
        "designation": "Senior Investment Analyst",
        "role": "EMPLOYEE",
        "is_active": True,
    },
    "aditi.sharma@dspamc.com": {
        "id": "11111111-1111-1111-1111-111111111111",
        "employee_code": "EMP-1001",
        "email": "aditi.sharma@dspamc.com",
        "password": "Password@123",
        "full_name": "Aditi Sharma",
        "department": "Equities & Wealth Management",
        "designation": "Senior Investment Analyst",
        "role": "EMPLOYEE",
        "is_active": True,
    },
    "advisor@dspim.com": {
        "id": "11111111-1111-1111-1111-111111111111",
        "employee_code": "EMP-1001",
        "email": "aditi.sharma@dspamc.com",
        "password": "Password@123",
        "full_name": "Aditi Sharma",
        "department": "Equities & Wealth Management",
        "designation": "Senior Investment Analyst",
        "role": "EMPLOYEE",
        "is_active": True,
    },
    "emp-1002": {
        "id": "22222222-2222-2222-2222-222222222222",
        "employee_code": "EMP-1002",
        "email": "rohan.mehta@dspamc.com",
        "password": "Password@123",
        "full_name": "Rohan Mehta",
        "department": "Quantitative Strategies & Risk",
        "designation": "Quantitative Strategist",
        "role": "EMPLOYEE",
        "is_active": True,
    },
    "rohan.mehta@dspamc.com": {
        "id": "22222222-2222-2222-2222-222222222222",
        "employee_code": "EMP-1002",
        "email": "rohan.mehta@dspamc.com",
        "password": "Password@123",
        "full_name": "Rohan Mehta",
        "department": "Quantitative Strategies & Risk",
        "designation": "Quantitative Strategist",
        "role": "EMPLOYEE",
        "is_active": True,
    },
    "quant@dspim.com": {
        "id": "22222222-2222-2222-2222-222222222222",
        "employee_code": "EMP-1002",
        "email": "rohan.mehta@dspamc.com",
        "password": "Password@123",
        "full_name": "Rohan Mehta",
        "department": "Quantitative Strategies & Risk",
        "designation": "Quantitative Strategist",
        "role": "EMPLOYEE",
        "is_active": True,
    },
    "emp-1003": {
        "id": "33333333-3333-3333-3333-333333333333",
        "employee_code": "EMP-1003",
        "email": "priya.nair@dspamc.com",
        "password": "Password@123",
        "full_name": "Priya Nair",
        "department": "Legal & Regulatory Compliance",
        "designation": "Compliance Specialist",
        "role": "COMPLIANCE",
        "is_active": True,
    },
    "priya.nair@dspamc.com": {
        "id": "33333333-3333-3333-3333-333333333333",
        "employee_code": "EMP-1003",
        "email": "priya.nair@dspamc.com",
        "password": "Password@123",
        "full_name": "Priya Nair",
        "department": "Legal & Regulatory Compliance",
        "designation": "Compliance Specialist",
        "role": "COMPLIANCE",
        "is_active": True,
    },
    "compliance@dspim.com": {
        "id": "33333333-3333-3333-3333-333333333333",
        "employee_code": "EMP-1003",
        "email": "priya.nair@dspamc.com",
        "password": "Password@123",
        "full_name": "Priya Nair",
        "department": "Legal & Regulatory Compliance",
        "designation": "Compliance Specialist",
        "role": "COMPLIANCE",
        "is_active": True,
    },
    "emp-1004": {
        "id": "44444444-4444-4444-4444-444444444444",
        "employee_code": "EMP-1004",
        "email": "vikram.malhotra@dspamc.com",
        "password": "Password@123",
        "full_name": "Vikram Malhotra",
        "department": "Equities & Asset Management",
        "designation": "Managing Director & Head of Equities",
        "role": "MANAGER",
        "is_active": True,
    },
    "vikram.malhotra@dspamc.com": {
        "id": "44444444-4444-4444-4444-444444444444",
        "employee_code": "EMP-1004",
        "email": "vikram.malhotra@dspamc.com",
        "password": "Password@123",
        "full_name": "Vikram Malhotra",
        "department": "Equities & Asset Management",
        "designation": "Managing Director & Head of Equities",
        "role": "MANAGER",
        "is_active": True,
    },
    "emp-1005": {
        "id": "55555555-5555-5555-5555-555555555555",
        "employee_code": "EMP-1005",
        "email": "ananya.desai@dspamc.com",
        "password": "Password@123",
        "full_name": "Ananya Desai",
        "department": "Executive Leadership & Operations",
        "designation": "Chief Operating Officer & System Admin",
        "role": "ADMIN",
        "is_active": True,
    },
    "ananya.desai@dspamc.com": {
        "id": "55555555-5555-5555-5555-555555555555",
        "employee_code": "EMP-1005",
        "email": "ananya.desai@dspamc.com",
        "password": "Password@123",
        "full_name": "Ananya Desai",
        "department": "Executive Leadership & Operations",
        "designation": "Chief Operating Officer & System Admin",
        "role": "ADMIN",
        "is_active": True,
    },
    "employee@dspamc.com": {
        "id": "11111111-1111-1111-1111-111111111111",
        "employee_code": "EMP-1001",
        "email": "aditi.sharma@dspamc.com",
        "password": "Password@123",
        "full_name": "Aditi Sharma",
        "department": "Equities & Wealth Management",
        "designation": "Senior Investment Analyst",
        "role": "EMPLOYEE",
        "is_active": True,
    },
    "employee": {
        "id": "11111111-1111-1111-1111-111111111111",
        "employee_code": "EMP-1001",
        "email": "aditi.sharma@dspamc.com",
        "password": "Password@123",
        "full_name": "Aditi Sharma",
        "department": "Equities & Wealth Management",
        "designation": "Senior Investment Analyst",
        "role": "EMPLOYEE",
        "is_active": True,
    },
    "manager@dspamc.com": {
        "id": "44444444-4444-4444-4444-444444444444",
        "employee_code": "EMP-1004",
        "email": "vikram.malhotra@dspamc.com",
        "password": "Password@123",
        "full_name": "Vikram Malhotra",
        "department": "Equities & Asset Management",
        "designation": "Managing Director & Head of Equities",
        "role": "MANAGER",
        "is_active": True,
    },
    "manager": {
        "id": "44444444-4444-4444-4444-444444444444",
        "employee_code": "EMP-1004",
        "email": "vikram.malhotra@dspamc.com",
        "password": "Password@123",
        "full_name": "Vikram Malhotra",
        "department": "Equities & Asset Management",
        "designation": "Managing Director & Head of Equities",
        "role": "MANAGER",
        "is_active": True,
    },
    "admin@dspamc.com": {
        "id": "55555555-5555-5555-5555-555555555555",
        "employee_code": "EMP-1005",
        "email": "ananya.desai@dspamc.com",
        "password": "Password@123",
        "full_name": "Ananya Desai",
        "department": "Executive Leadership & Operations",
        "designation": "Chief Operating Officer & System Admin",
        "role": "ADMIN",
        "is_active": True,
    },
    "admin": {
        "id": "55555555-5555-5555-5555-555555555555",
        "employee_code": "EMP-1005",
        "email": "ananya.desai@dspamc.com",
        "password": "Password@123",
        "full_name": "Ananya Desai",
        "department": "Executive Leadership & Operations",
        "designation": "Chief Operating Officer & System Admin",
        "role": "ADMIN",
        "is_active": True,
    },
    "compliance": {
        "id": "33333333-3333-3333-3333-333333333333",
        "employee_code": "EMP-1003",
        "email": "priya.nair@dspamc.com",
        "password": "Password@123",
        "full_name": "Priya Nair",
        "department": "Legal & Regulatory Compliance",
        "designation": "Compliance Specialist",
        "role": "COMPLIANCE",
        "is_active": True,
    },
    # Onboardee Personas for testing onboarding views
    "emp-2001": {
        "id": "20012001-2001-2001-2001-200120012001",
        "employee_code": "EMP-2001",
        "email": "kavya.reddy@dspamc.com",
        "password": "Password@123",
        "full_name": "Kavya Reddy",
        "department": "Equities & Wealth Management",
        "designation": "Junior Research Analyst",
        "role": "EMPLOYEE",
        "is_active": True,
    },
    "kavya.reddy@dspamc.com": {
        "id": "20012001-2001-2001-2001-200120012001",
        "employee_code": "EMP-2001",
        "email": "kavya.reddy@dspamc.com",
        "password": "Password@123",
        "full_name": "Kavya Reddy",
        "department": "Equities & Wealth Management",
        "designation": "Junior Research Analyst",
        "role": "EMPLOYEE",
        "is_active": True,
    },
    "kavya": {
        "id": "20012001-2001-2001-2001-200120012001",
        "employee_code": "EMP-2001",
        "email": "kavya.reddy@dspamc.com",
        "password": "Password@123",
        "full_name": "Kavya Reddy",
        "department": "Equities & Wealth Management",
        "designation": "Junior Research Analyst",
        "role": "EMPLOYEE",
        "is_active": True,
    },
    "emp-2002": {
        "id": "20022002-2002-2002-2002-200220022002",
        "employee_code": "EMP-2002",
        "email": "arjun.pillai@dspamc.com",
        "password": "Password@123",
        "full_name": "Arjun Pillai",
        "department": "Quantitative Strategies & Risk",
        "designation": "Quantitative Risk Analyst",
        "role": "EMPLOYEE",
        "is_active": True,
    },
    "arjun.pillai@dspamc.com": {
        "id": "20022002-2002-2002-2002-200220022002",
        "employee_code": "EMP-2002",
        "email": "arjun.pillai@dspamc.com",
        "password": "Password@123",
        "full_name": "Arjun Pillai",
        "department": "Quantitative Strategies & Risk",
        "designation": "Quantitative Risk Analyst",
        "role": "EMPLOYEE",
        "is_active": True,
    },
    "emp-2003": {
        "id": "20032003-2003-2003-2003-200320032003",
        "employee_code": "EMP-2003",
        "email": "meera.kapoor@dspamc.com",
        "password": "Password@123",
        "full_name": "Meera Kapoor",
        "department": "Legal & Regulatory Compliance",
        "designation": "Junior Compliance Officer",
        "role": "EMPLOYEE",
        "is_active": True,
    },
    "meera.kapoor@dspamc.com": {
        "id": "20032003-2003-2003-2003-200320032003",
        "employee_code": "EMP-2003",
        "email": "meera.kapoor@dspamc.com",
        "password": "Password@123",
        "full_name": "Meera Kapoor",
        "department": "Legal & Regulatory Compliance",
        "designation": "Junior Compliance Officer",
        "role": "EMPLOYEE",
        "is_active": True,
    },
}


@router.post("/login", response_model=APIResponse)
async def login(
    request: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate user by Employee ID or Email and establish secure session."""
    identifier_clean = request.email.strip().lower()
    user = None

    # 1. Try DB lookup if database is online
    if db is not None:
        try:
            result = await db.execute(
                select(User).where((User.email == identifier_clean) | (User.employee_code == identifier_clean.upper()))
            )
            user = result.scalar_one_or_none()
        except Exception:
            user = None

    if user is not None:
        if not verify_password(request.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid employee credentials or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled",
            )
        user.last_login = datetime.now(timezone.utc)
        user_id = str(user.id)
        user_role = user.role
        full_name = user.full_name
        email = user.email
        employee_code = user.employee_code or "EMP-1001"
        department = user.department or "Operations"
        designation = user.designation or "Employee"

    # 2. Check Institutional Demo accounts in development / local demo fallback
    elif identifier_clean in INSTITUTIONAL_DEMO_USERS:
        demo_u = INSTITUTIONAL_DEMO_USERS[identifier_clean]
        valid_passwords = (
            demo_u["password"], "Password@123", "Employee@123", "Manager@123",
            "Admin@123", "Compliance@123", "demo", "Demo@123", "password",
            "Advisor@123", "Quant@123"
        )
        if request.password not in valid_passwords:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid employee credentials or password",
            )
        user_id = demo_u["id"]
        user_role = demo_u["role"]
        full_name = demo_u["full_name"]
        email = demo_u["email"]
        employee_code = demo_u["employee_code"]
        department = demo_u["department"]
        designation = demo_u["designation"]

    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid employee credentials or password",
        )

    token_data = {"sub": user_id, "role": user_role, "emp_code": employee_code}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Set secure HttpOnly session cookie
    response.set_cookie(
        key="dsp_access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,  # localhost / dev friendly
        max_age=settings.jwt_access_token_expire_minutes * 60,
        path="/",
    )

    return APIResponse(
        success=True,
        data={
            "user": {
                "id": user_id,
                "employee_code": employee_code,
                "email": email,
                "full_name": full_name,
                "role": user_role,
                "department": department,
                "designation": designation,
            },
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": settings.jwt_access_token_expire_minutes * 60,
            },
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="auth",
            data_status="AUTHENTICATED",
            is_demo=settings.is_demo,
        ),
    )


@router.post("/logout", response_model=APIResponse)
async def logout(response: Response):
    """Log out user, clearing secure HttpOnly session cookie."""
    response.delete_cookie(key="dsp_access_token", path="/")
    return APIResponse(
        success=True,
        data={"logged_out": True, "message": "Session invalidated"},
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="auth",
            data_status="LOGGED_OUT",
            is_demo=settings.is_demo,
        ),
    )


@router.get("/me", response_model=APIResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return APIResponse(
        success=True,
        data={
            "id": str(current_user.id),
            "employee_code": getattr(current_user, "employee_code", None) or "EMP-1001",
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "department": getattr(current_user, "department", None) or "Operations",
            "designation": getattr(current_user, "designation", None) or "Employee",
            "is_active": current_user.is_active,
            "is_verified": current_user.is_verified,
        },
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="auth",
            data_status="ACTIVE_SESSION",
            is_demo=settings.is_demo,
        ),
    )

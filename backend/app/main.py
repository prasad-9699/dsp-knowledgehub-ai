"""
DSP KnowledgeHub AI – Employee Self-Service Portal — Main Application

Production-oriented FastAPI application with:
- CORS configuration
- Rate limiting
- Dynamic Health checks
- Structured logging
- Role-based access control
- RAG & Synthetic Demo mode support
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import structlog

from app.core.config import get_settings
from app.core.database import init_db, close_db
from app.api import auth, research, self_service, onboarding

# Import user model
from app.models.user import User  # noqa: F401

settings = get_settings()

# Structured logging
logging.basicConfig(level=logging.INFO if not settings.app_debug else logging.DEBUG)
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer() if settings.log_format == "json"
        else structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info(
        "Starting DSP KnowledgeHub AI – Employee Self-Service Portal",
        app_name=settings.app_name,
        env=settings.app_env,
        demo_mode=settings.is_demo,
        version="2.0.0",
    )

    db_connected = False
    db_error = None
    db_mode = "unconfigured"

    # Evaluate database strategy:
    # 1. If DEMO_MODE=True and no remote database is configured, safely use synthetic in-memory store (no [Errno 111]).
    # 2. If a remote database URL is configured (Render Postgres, AWS RDS, Neon), always connect.
    # 3. If in local development (non-production) and not demo mode, attempt local database connection.
    # 4. If in production (DEMO_MODE=False), database is strictly required. A connection failure raises a fatal error.
    if settings.is_demo and not settings.is_remote_db:
        should_connect = False
    elif settings.is_remote_db:
        should_connect = True
    else:
        should_connect = not settings.is_production

    if should_connect:
        try:
            await init_db()
            db_connected = True
            db_mode = "postgresql"
            logger.info("PostgreSQL database initialized successfully")
        except Exception as e:
            db_error = str(e)
            logger.error("PostgreSQL database initialization failed", error=db_error)
            if settings.is_production and not settings.is_demo:
                raise RuntimeError(
                    f"FATAL: Production database initialization failed ({db_error}). "
                    "Ensure DATABASE_URL is correctly set in your environment variables."
                ) from e
            elif settings.is_demo:
                db_mode = "synthetic_in_memory"
                logger.warning(
                    "DEMO_MODE=True: PostgreSQL unreachable, safely operating with synthetic in-memory data store",
                    error=db_error,
                )
            else:
                db_mode = "offline"
    else:
        # Production with unconfigured / localhost database
        if settings.is_demo:
            db_mode = "synthetic_in_memory"
            logger.info(
                "DEMO_MODE is active: Using synthetic in-memory persistence engine (PostgreSQL not connected). "
                "All HR self-service, leave, approvals, and onboarding workflows are active with synthetic demo data."
            )
        else:
            raise RuntimeError(
                "FATAL: In production mode (DEMO_MODE=false), a valid remote DATABASE_URL is required. "
                f"Current URL points to localhost: {settings.database_url}"
            )

    # Attach live DB status to app state for dynamic /health checks
    app.state.db_connected = db_connected
    app.state.db_error = db_error
    app.state.db_mode = db_mode

    yield

    # Cleanup
    if db_connected:
        await close_db()
    logger.info("DSP KnowledgeHub AI application shutdown complete")


app = FastAPI(
    title="DSP KnowledgeHub AI — Employee HR & Process Intelligence",
    description=(
        "Enterprise conversational AI and RAG pipeline for DSP Asset Management Company (DSPAMC) employees.\n\n"
        "Provides grounded knowledge across:\n"
        "• Human Resources: Leave & absence policies, parental benefits, PeoplePulse workflows\n"
        "• Onboarding & L&D: New hire roadmap, buddy program, mandatory NISM regulatory certifications\n"
        "• Information Technology: ServiceHub access requests, Bloomberg terminals, VPN, Microsoft Authenticator 2FA\n"
        "• Finance & Travel: SAP Concur expense claims, per diem allowances, GST invoice rules\n"
        "• Legal & Compliance: SEBI personal trading codes, 48-hour pre-clearance window, restricted list"
    ),
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)


# ─── CORS ────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Global Exception Handler ───────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "data": None,
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": "error_handler",
                "data_status": "N/A",
                "is_demo": settings.is_demo,
            },
            "error": "An internal error occurred. Please try again later.",
        },
    )


# ─── Health Check ────────────────────────────────────────────────────
@app.get("/health")
@app.get("/api/v1/health")
async def health_check():
    """
    Health check endpoint for load balancers, monitoring, and cloud orchestrators.
    Actively checks database connectivity and reports real service status.
    """
    db_mode = getattr(app.state, "db_mode", "unconfigured")
    db_error = getattr(app.state, "db_error", None)
    db_healthy = False

    if db_mode == "postgresql":
        # Actively test connection via SELECT 1
        from app.core.database import check_db_connection
        is_live, err = await check_db_connection()
        if is_live:
            db_healthy = True
            db_status = "connected"
        else:
            db_status = "disconnected"
            db_error = err
    elif db_mode == "synthetic_in_memory":
        db_healthy = True
        db_status = "synthetic_in_memory (demo mode active)"
    else:
        db_status = "offline"

    # In strict production (non-demo), database must be live for overall health
    is_overall_healthy = db_healthy if (settings.is_production and not settings.is_demo) else True

    response_payload = {
        "status": "healthy" if is_overall_healthy else "unhealthy",
        "application": settings.app_name,
        "version": "2.0.0",
        "environment": settings.app_env,
        "demo_mode": settings.is_demo,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "database": db_status,
            "database_error": db_error,
            "hr_self_service": "operational",
            "onboarding": "operational",
            "knowledge_rag": "operational",
            "identity_auth": "operational",
        },
    }

    if not is_overall_healthy:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=response_payload,
        )

    return response_payload


# ─── API Routes ──────────────────────────────────────────────────────
# Mounted both with /api/v1 (standard REST) and root (direct deployment compatibility)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(self_service.router, prefix="/api/v1")
app.include_router(onboarding.router, prefix="/api/v1")
app.include_router(research.router, prefix="/api/v1")

app.include_router(auth.router)
app.include_router(self_service.router)
app.include_router(onboarding.router)
app.include_router(research.router)


# ─── Root ────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": "2.0.0",
        "status": "running",
        "api_docs": "/api/docs",
        "message": "DSP KnowledgeHub AI — Employee HR & Process Intelligence Platform",
    }

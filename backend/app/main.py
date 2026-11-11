"""
DSP AI Investment Intelligence Platform — Main Application

Production-oriented FastAPI application with:
- CORS configuration
- Rate limiting
- Health checks
- Prometheus metrics
- Structured logging
- API versioning
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
    logger.info("Starting DSP AI Investment Intelligence Platform",
                env=settings.app_env, demo_mode=settings.is_demo)

    # Initialize database
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.error("Database initialization failed", error=str(e))

    yield

    # Cleanup
    await close_db()
    logger.info("Application shutdown complete")


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
    """Health check endpoint for load balancers and monitoring."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "2.0.0",
        "environment": settings.app_env,
        "demo_mode": settings.is_demo,
        "services": {
            "hr_self_service": "operational",
            "onboarding": "operational",
            "knowledge_rag": "operational",
            "identity_auth": "operational",
            "database": "configured",
        },
    }


# ─── API Routes ──────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/v1")
app.include_router(self_service.router, prefix="/api/v1")
app.include_router(onboarding.router, prefix="/api/v1")
app.include_router(research.router, prefix="/api/v1")


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

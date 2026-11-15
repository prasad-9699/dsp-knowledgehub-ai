"""
Database configuration and session management.

Uses SQLAlchemy async engine with PostgreSQL/TimescaleDB.
"""

from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import MetaData

from app.core.config import get_settings

settings = get_settings()

# Naming convention for constraints (Alembic compatibility)
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=convention)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    metadata = metadata


# Normalize database URL for SQLAlchemy Asyncpg driver compatibility
_db_url = settings.database_url
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif _db_url.startswith("postgresql://") and not _db_url.startswith("postgresql+asyncpg://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Async engine
engine = create_async_engine(
    _db_url,
    echo=settings.app_debug,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args={"timeout": 5},
)

# Session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    """Dependency to get database session with offline fallback."""
    session = None
    try:
        async with async_session_factory() as s:
            session = s
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    except Exception:
        # If database server is offline (e.g. local dev without Postgres container)
        if session is None:
            yield None
        else:
            raise


async def check_db_connection() -> tuple[bool, Optional[str]]:
    """Test live database connectivity using a lightweight query."""
    if engine is None:
        return False, "Database engine not initialized"
    try:
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True, None
    except Exception as e:
        return False, str(e)


async def init_db():
    """Initialize database tables."""
    import app.models  # noqa: F401 - ensure all models are registered on Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connections."""
    if engine is not None:
        await engine.dispose()

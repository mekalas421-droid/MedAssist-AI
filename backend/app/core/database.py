# """
# Database connections:
#  - MySQL via SQLAlchemy (async engine + session factory, aiomysql driver)
# """
# from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
# from sqlalchemy.orm import declarative_base

# from app.core.config import settings

# # ---------------- MySQL ----------------
# engine = create_async_engine(
#     settings.DATABASE_URL,
#     echo=settings.DEBUG,
#     future=True,
#     pool_pre_ping=True,
#     pool_recycle=300,
# )
# AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
# Base = declarative_base()


# async def get_db() -> AsyncSession:
#     """FastAPI dependency that yields a scoped async DB session."""
#     async with AsyncSessionLocal() as session:
#         try:
#             yield session
#         finally:
#             await session.close()



"""
Database connections:
- MySQL via SQLAlchemy AsyncEngine
- Railway production uses MYSQL_PUBLIC_URL
- Async driver: aiomysql
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

from app.core.config import settings


# ============================================================
# DATABASE URL
# ============================================================

DATABASE_URL = settings.DATABASE_URL

# Do NOT print the password.
# This only prints safe connection information for Railway logs.
safe_url = DATABASE_URL.split("@")[-1]

print("==========================================")
print("MedAssist AI - DATABASE CONFIG")
print("Database Driver:", DATABASE_URL.split("://")[0])
print("Database Server:", safe_url)
print("==========================================")


# ============================================================
# MYSQL ASYNC ENGINE
# ============================================================

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
)


# ============================================================
# ASYNC SESSION
# ============================================================

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ============================================================
# SQLAlchemy BASE
# ============================================================

Base = declarative_base()


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

async def get_db():
    """
    FastAPI database dependency.

    Creates an async MySQL session and closes it
    automatically after the request.
    """

    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

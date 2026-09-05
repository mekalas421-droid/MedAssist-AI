"""
Creates all MySQL tables from SQLAlchemy models.
Run once on a fresh database (or rely on database/schema.sql directly).

Usage:
    python -m app.db.init_db
"""
import asyncio

from app import (
    models,  # noqa: F401  (ensures all models are registered on Base.metadata)
)
from app.core.database import Base, engine


async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("All tables created successfully.")


if __name__ == "__main__":
    asyncio.run(init_models())

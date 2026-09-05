import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def alter_table():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE patient_symptoms ADD COLUMN severity ENUM('mild', 'moderate', 'severe', 'critical');"))
            await conn.execute(text("ALTER TABLE patient_symptoms ADD COLUMN duration_value INT;"))
            await conn.execute(text("ALTER TABLE patient_symptoms ADD COLUMN duration_unit ENUM('hours', 'days', 'weeks', 'months');"))
            await conn.execute(text("ALTER TABLE patient_symptoms ADD COLUMN pain_level INT;"))
            await conn.execute(text("ALTER TABLE patient_symptoms ADD COLUMN frequency ENUM('continuous', 'occasional', 'morning', 'night', 'after_food');"))
            await conn.execute(text("ALTER TABLE patient_symptoms ADD COLUMN triggers_text TEXT;"))
            await conn.execute(text("ALTER TABLE patient_symptoms ADD COLUMN previous_history BOOLEAN DEFAULT FALSE;"))
            print("Successfully altered patient_symptoms table.")
        except Exception as e:
            print(f"Note on patient_symptoms: {e}")

        try:
            await conn.execute(text("ALTER TABLE health_reports ADD COLUMN review_status VARCHAR(30) NOT NULL DEFAULT 'approved';"))
            await conn.execute(text("ALTER TABLE health_reports ADD COLUMN reviewed_by CHAR(36) NULL;"))
            await conn.execute(text("ALTER TABLE health_reports ADD COLUMN reviewed_at DATETIME NULL;"))
            await conn.execute(text("ALTER TABLE health_reports ADD COLUMN doctor_notes TEXT NULL;"))
            print("Successfully altered health_reports table.")
        except Exception as e:
            print(f"Note on health_reports: {e}")
    await engine.dispose()

asyncio.run(alter_table())

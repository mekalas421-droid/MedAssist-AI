import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.diagnostics import HealthReport
import uuid
import sys

async def main():
    try:
        from app.core.database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            # get any report
            result = await session.execute(select(HealthReport).limit(1))
            report = result.scalar_one_or_none()
            if not report:
                print("No reports found.")
                return
            
            print(f"Testing with report {report.submission_id}")
            
            from app.services.pdf_service import generate_health_report_pdf
            report_dict = report.report_data
            report_dict['submission_id'] = str(report.submission_id)
            report_dict['patient_id'] = str(report.patient_id)
            report_dict['generated_at'] = report.generated_at
            
            patient_name = "Test User"
            patient_email = "test@example.com"
            
            pdf_buffer = generate_health_report_pdf(report_dict, patient_name, patient_email)
            print("Successfully generated PDF!")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import asyncio
    # fix sys path
    import os
    import sys
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
    asyncio.run(main())

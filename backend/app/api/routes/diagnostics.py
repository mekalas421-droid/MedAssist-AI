"""
Diagnostics routes — orchestrates the AI pipeline on top of a symptom submission:
  POST /api/v1/diagnostics/predict/{submission_id}  -> runs prediction+risk+recommendations, saves report
  GET  /api/v1/diagnostics/report/{submission_id}   -> fetch the consolidated report
  GET  /api/v1/diagnostics/reports/me               -> list the current patient's reports
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.diagnostics import (
    DiseasePrediction,
    HealthReport,
    Recommendation,
    RiskAssessment,
)
from app.models.patient import PatientProfile
from app.models.symptom import SymptomSubmission
from app.models.user import User, UserRole
from datetime import datetime, timezone
from app.schemas.diagnostics import (
    DiagnosticsRunResult,
    DiseasePredictionOut,
    HealthReportOut,
    RecommendationOut,
    ReviewReportPayload,
    RiskAssessmentOut,
)
from app.services import prediction_engine

router = APIRouter(prefix="/api/v1/diagnostics", tags=["Diagnostics"])


async def _get_owned_submission(
    submission_id: uuid.UUID, current_user: User, db: AsyncSession
) -> tuple[SymptomSubmission, PatientProfile]:
    result = await db.execute(select(SymptomSubmission).where(SymptomSubmission.id == submission_id))
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found.")

    result = await db.execute(select(PatientProfile).where(PatientProfile.id == submission.patient_id))
    profile = result.scalar_one_or_none()

    if current_user.role == UserRole.PATIENT and (not profile or profile.user_id != current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this submission.")

    return submission, profile


@router.post("/predict/{submission_id}", response_model=DiagnosticsRunResult)
async def run_prediction(
    submission_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    submission, profile = await _get_owned_submission(submission_id, current_user, db)

    # Idempotency: if a report already exists for this submission, return it instead of re-running
    result = await db.execute(select(HealthReport).where(HealthReport.submission_id == submission_id))
    existing_report = result.scalar_one_or_none()
    if existing_report:
        return await _build_run_result(submission_id, db)

    pipeline_result = await prediction_engine.run_pipeline(
        db=db,
        submission_id=submission.id,
        patient_id=submission.patient_id,
        submitted_symptom_ids=list(submission.submitted_symptoms),
    )

    submission.status = "processed"
    await db.commit()

    return await _build_run_result(submission_id, db)


async def _build_run_result(submission_id: uuid.UUID, db: AsyncSession) -> DiagnosticsRunResult:
    from app.models.symptom import DiseaseMaster

    pred_rows = await db.execute(
        select(DiseasePrediction, DiseaseMaster.display_name)
        .join(DiseaseMaster, DiseaseMaster.id == DiseasePrediction.disease_id)
        .where(DiseasePrediction.submission_id == submission_id)
        .order_by(DiseasePrediction.rank)
    )
    predictions = [
        DiseasePredictionOut(
            id=row.DiseasePrediction.id,
            disease_id=row.DiseasePrediction.disease_id,
            disease_name=row.display_name,
            probability=float(row.DiseasePrediction.probability),
            confidence_score=float(row.DiseasePrediction.confidence_score),
            rank=row.DiseasePrediction.rank,
        )
        for row in pred_rows.all()
    ]

    result = await db.execute(select(RiskAssessment).where(RiskAssessment.submission_id == submission_id))
    risk = result.scalar_one_or_none()
    if not risk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk assessment not found.")

    result = await db.execute(
        select(Recommendation)
        .where(Recommendation.submission_id == submission_id)
        .order_by(Recommendation.priority)
    )
    recommendations = result.scalars().all()

    result = await db.execute(select(HealthReport).where(HealthReport.submission_id == submission_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    return DiagnosticsRunResult(
        submission_id=submission_id,
        predictions=predictions,
        risk_assessment=RiskAssessmentOut.model_validate(risk),
        recommendations=[RecommendationOut.model_validate(r) for r in recommendations],
        report=HealthReportOut.model_validate(report),
    )


@router.get("/report/{submission_id}", response_model=HealthReportOut)
async def get_report(
    submission_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_owned_submission(submission_id, current_user, db)
    result = await db.execute(select(HealthReport).where(HealthReport.submission_id == submission_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    return report


@router.get("/report/{submission_id}/pdf")
async def get_report_pdf(
    submission_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from fastapi.responses import StreamingResponse
    from app.services.pdf_service import generate_health_report_pdf

    await _get_owned_submission(submission_id, current_user, db)
    result = await db.execute(select(HealthReport).where(HealthReport.submission_id == submission_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    
    # Extract data for PDF
    report_dict = report.report_data
    # Append backend metadata
    report_dict['submission_id'] = str(submission_id)
    report_dict['patient_id'] = str(report.patient_id)
    report_dict['generated_at'] = report.generated_at
    
    patient_name = current_user.full_name or "Patient"
    patient_email = current_user.email or "N/A"
    
    pdf_buffer = generate_health_report_pdf(report_dict, patient_name, patient_email)
    
    filename = f"MedAssist_Report_{patient_name.replace(' ', '_')}_{report.generated_at.strftime('%Y-%m-%d')}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/reports/me", response_model=list[HealthReportOut])
async def my_reports(
    current_user: User = Depends(require_roles(UserRole.PATIENT)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PatientProfile).where(PatientProfile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found.")

    result = await db.execute(
        select(HealthReport)
        .where(HealthReport.patient_id == profile.id)
        .order_by(HealthReport.generated_at.desc())
    )
    return result.scalars().all()


@router.post("/reports/{report_id}/review", response_model=HealthReportOut)
async def review_report(
    report_id: uuid.UUID,
    payload: ReviewReportPayload,
    current_user: User = Depends(require_roles(UserRole.DOCTOR, UserRole.CLINIC, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Doctor / Provider review workflow: approve or reject a report and attach clinical notes."""
    result = await db.execute(select(HealthReport).where(HealthReport.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    review_status = payload.status.lower()
    if review_status not in ("approved", "rejected"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be either 'approved' or 'rejected'.",
        )

    now = datetime.now(timezone.utc)
    report.review_status = review_status
    report.reviewed_by = current_user.id
    report.reviewed_at = now
    report.doctor_notes = payload.doctor_notes

    # Update report_data snapshot dictionary
    updated_data = dict(report.report_data or {})
    updated_data["provider_review"] = {
        "status": review_status,
        "reviewed_by": current_user.full_name or "Doctor / Clinical Provider",
        "reviewed_by_id": str(current_user.id),
        "reviewed_at": now.isoformat(),
        "doctor_notes": payload.doctor_notes or "",
    }

    # Optionally append extra custom recommendations from doctor
    if payload.additional_recommendations:
        recs = updated_data.get("recommendations", [])
        for custom_rec in payload.additional_recommendations:
            if custom_rec.strip():
                recs.append({"type": "doctor_guidance", "content": custom_rec.strip()})
        updated_data["recommendations"] = recs

    report.report_data = updated_data
    await db.commit()
    await db.refresh(report)

    return report


@router.get("/reports/pending", response_model=list[HealthReportOut])
async def list_pending_reports(
    current_user: User = Depends(require_roles(UserRole.DOCTOR, UserRole.CLINIC, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """List reports awaiting clinician review."""
    result = await db.execute(
        select(HealthReport)
        .where(HealthReport.review_status == "pending")
        .order_by(HealthReport.generated_at.desc())
    )
    return result.scalars().all()


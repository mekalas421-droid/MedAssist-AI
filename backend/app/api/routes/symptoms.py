"""
Symptom Collection Workflow:
 - GET  /symptoms                 -> list the master symptom catalogue (for the selection UI)
 - POST /symptoms/submit          -> patient submits selected symptoms (validated + logged to Mongo)
 - GET  /symptoms/submissions/me  -> patient's own submission history
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.doctor import PatientSymptom
from app.models.patient import PatientProfile
from app.models.symptom import SymptomMaster, SymptomSubmission
from app.models.user import User, UserRole
from app.schemas.symptom import (
    SymptomOut,
    SymptomSubmissionCreate,
    SymptomSubmissionOut,
)

router = APIRouter(prefix="/api/v1/symptoms", tags=["Symptoms"])


@router.get("", response_model=list[SymptomOut])
async def list_symptoms(category: str | None = None, db: AsyncSession = Depends(get_db)):
    """Returns the symptom catalogue used to power the frontend's Symptom Selector."""
    query = select(SymptomMaster).order_by(SymptomMaster.display_name)
    if category:
        query = query.where(SymptomMaster.category == category)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/submit", response_model=SymptomSubmissionOut, status_code=status.HTTP_201_CREATED)
async def submit_symptoms(
    payload: SymptomSubmissionCreate,
    current_user: User = Depends(require_roles(UserRole.PATIENT)),
    db: AsyncSession = Depends(get_db),
):
    # 1. Resolve the patient's profile
    result = await db.execute(select(PatientProfile).where(PatientProfile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found.")

    # 2. Validate submitted symptom IDs exist in the master catalogue
    submitted_ids = [s.symptom_id for s in payload.symptoms]
    result = await db.execute(
        select(SymptomMaster).where(SymptomMaster.id.in_(submitted_ids))
    )
    valid_symptoms = result.scalars().all()
    if len(valid_symptoms) != len(set(submitted_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more submitted symptom IDs are invalid.",
        )

    # 3. Persist the relational anchor record
    submission = SymptomSubmission(
        patient_id=profile.id,
        submitted_symptoms=[s.id for s in valid_symptoms],
        free_text_notes=payload.free_text_notes,
        mongo_log_id=None,
        status="submitted",
    )
    db.add(submission)
    await db.flush()  # get submission.id

    # 4. Populate normalized link table patient_symptoms with rich data
    for s_meta in payload.symptoms:
        ps = PatientSymptom(
            submission_id=submission.id,
            symptom_id=s_meta.symptom_id,
            severity=s_meta.severity,
            duration_value=s_meta.duration_value,
            duration_unit=s_meta.duration_unit,
            pain_level=s_meta.pain_level,
            frequency=s_meta.frequency,
            triggers_text=s_meta.triggers_text,
            previous_history=s_meta.previous_history
        )
        db.add(ps)

    await db.commit()
    await db.refresh(submission)
    return submission


@router.get("/submissions/me", response_model=list[SymptomSubmissionOut])
async def my_submissions(
    current_user: User = Depends(require_roles(UserRole.PATIENT)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PatientProfile).where(PatientProfile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found.")

    result = await db.execute(
        select(SymptomSubmission)
        .where(SymptomSubmission.patient_id == profile.id)
        .order_by(SymptomSubmission.created_at.desc())
    )
    return result.scalars().all()

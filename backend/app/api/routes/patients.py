"""
Patient Profile Management (CRUD) + Medical History tracking.

RBAC summary:
 - Patients can view/update their own profile & history.
 - Doctors/Clinic/Admin can view & manage profiles of patients assigned to them (Admin: all).
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.medical_history import MedicalHistory
from app.models.patient import PatientProfile
from app.models.user import User, UserRole
from app.schemas.patient import (
    MedicalHistoryCreate,
    MedicalHistoryOut,
    MedicalHistoryUpdate,
    PatientProfileOut,
    PatientProfileUpdate,
)

router = APIRouter(prefix="/api/v1/patients", tags=["Patients"])


async def _get_profile_or_404(patient_id: uuid.UUID, db: AsyncSession) -> PatientProfile:
    result = await db.execute(select(PatientProfile).where(PatientProfile.id == patient_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found.")
    return profile


def _authorize_patient_access(profile: PatientProfile, current_user: User):
    """Patients may only touch their own profile; staff roles are permitted broadly (Milestone 1 scope)."""
    if current_user.role == UserRole.PATIENT and profile.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this patient.")


# ---------------- Patient Profile CRUD ----------------
@router.get("/me", response_model=PatientProfileOut)
async def get_my_profile(
    current_user: User = Depends(require_roles(UserRole.PATIENT)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PatientProfile).where(PatientProfile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
    return profile


@router.get("/{patient_id}", response_model=PatientProfileOut)
async def get_patient(
    patient_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_profile_or_404(patient_id, db)
    _authorize_patient_access(profile, current_user)
    return profile


@router.put("/{patient_id}", response_model=PatientProfileOut)
async def update_patient(
    patient_id: uuid.UUID,
    payload: PatientProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_profile_or_404(patient_id, db)
    _authorize_patient_access(profile, current_user)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_profile_or_404(patient_id, db)
    await db.delete(profile)
    await db.commit()


# ---------------- Medical History ----------------
@router.post(
    "/{patient_id}/history", response_model=MedicalHistoryOut, status_code=status.HTTP_201_CREATED
)
async def add_medical_history(
    patient_id: uuid.UUID,
    payload: MedicalHistoryCreate,
    current_user: User = Depends(
        require_roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.CLINIC, UserRole.PATIENT)
    ),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_profile_or_404(patient_id, db)
    _authorize_patient_access(profile, current_user)

    record = MedicalHistory(
        patient_id=patient_id,
        recorded_by=current_user.id,
        **payload.model_dump(),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/{patient_id}/history", response_model=list[MedicalHistoryOut])
async def list_medical_history(
    patient_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_profile_or_404(patient_id, db)
    _authorize_patient_access(profile, current_user)

    result = await db.execute(
        select(MedicalHistory)
        .where(MedicalHistory.patient_id == patient_id)
        .order_by(MedicalHistory.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.patch("/history/{history_id}", response_model=MedicalHistoryOut)
async def update_medical_history(
    history_id: uuid.UUID,
    payload: MedicalHistoryUpdate,
    current_user: User = Depends(require_roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.CLINIC)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MedicalHistory).where(MedicalHistory.id == history_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)

    await db.commit()
    await db.refresh(record)
    return record

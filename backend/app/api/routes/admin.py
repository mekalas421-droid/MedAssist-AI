import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.diagnostics import AuditLog, HealthReport
from app.models.doctor import ActivityLog
from app.models.symptom import DiseaseMaster, SymptomMaster
from app.models.user import User, UserRole

router = APIRouter(prefix="/api/v1/admin", tags=["Admin Portal"])


class UserOutAdmin(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    phone_number: str | None
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityLogOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None
    action: str
    details: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class SymptomCreate(BaseModel):
    symptom_code: str
    display_name: str
    category: str | None = None


class DiseaseCreate(BaseModel):
    disease_code: str
    display_name: str
    description: str | None = None
    default_severity: str = "moderate"


from fastapi import APIRouter, Query


@router.get("/users", response_model=list[UserOutAdmin])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.CLINIC, UserRole.DOCTOR)),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(User).order_by(User.created_at.desc()).offset(skip).limit(limit))
    return res.scalars().all()


@router.patch("/users/{user_id}/toggle-active", response_model=UserOutAdmin)
async def toggle_user_active(
    user_id: uuid.UUID,
    admin: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/activity-logs", response_model=list[ActivityLogOut])
async def list_activity_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    admin: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(ActivityLog).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit))
    return res.scalars().all()


@router.post("/symptoms", status_code=status.HTTP_201_CREATED)
async def add_symptom(
    payload: SymptomCreate,
    admin: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    # Check if duplicate code
    res = await db.execute(select(SymptomMaster).where(SymptomMaster.symptom_code == payload.symptom_code))
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Symptom code already exists")

    symptom = SymptomMaster(
        symptom_code=payload.symptom_code,
        display_name=payload.display_name,
        category=payload.category,
        synonyms=[payload.display_name.lower()]
    )
    db.add(symptom)
    await db.commit()
    return {"message": "Symptom added successfully", "id": str(symptom.id)}


@router.delete("/symptoms/{symptom_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_symptom(
    symptom_id: uuid.UUID,
    admin: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(SymptomMaster).where(SymptomMaster.id == symptom_id))
    symptom = res.scalar_one_or_none()
    if not symptom:
        raise HTTPException(status_code=404, detail="Symptom not found")
    
    await db.delete(symptom)
    await db.commit()


@router.post("/diseases", status_code=status.HTTP_201_CREATED)
async def add_disease(
    payload: DiseaseCreate,
    admin: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(DiseaseMaster).where(DiseaseMaster.disease_code == payload.disease_code))
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Disease code already exists")

    from app.models.symptom import SeverityLevel
    try:
        sev = SeverityLevel(payload.default_severity.lower())
    except ValueError:
        sev = SeverityLevel.MODERATE

    disease = DiseaseMaster(
        disease_code=payload.disease_code,
        display_name=payload.display_name,
        description=payload.description,
        default_severity=sev
    )
    db.add(disease)
    await db.commit()
    return {"message": "Disease added successfully", "id": str(disease.id)}


@router.delete("/diseases/{disease_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_disease(
    disease_id: uuid.UUID,
    admin: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(DiseaseMaster).where(DiseaseMaster.id == disease_id))
    disease = res.scalar_one_or_none()
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")

    await db.delete(disease)
    await db.commit()


class AuditLogOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None
    action: str
    resource_type: str | None
    resource_id: uuid.UUID | None
    created_at: datetime

    class Config:
        from_attributes = True


class DiseaseOut(BaseModel):
    id: uuid.UUID
    disease_code: str
    display_name: str
    description: str | None
    default_severity: str
    created_at: datetime

    class Config:
        from_attributes = True


class DoctorOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    phone_number: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class HealthReportAdminOut(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    generated_at: datetime

    class Config:
        from_attributes = True


@router.get("/audit-logs", response_model=list[AuditLogOut])
async def list_audit_logs(
    admin: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(200))
    return res.scalars().all()


@router.get("/diseases", response_model=list[DiseaseOut])
async def list_diseases(
    admin: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(DiseaseMaster).order_by(DiseaseMaster.display_name))
    return res.scalars().all()


@router.get("/doctors", response_model=list[DoctorOut])
async def list_doctors(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.PATIENT, UserRole.CLINIC, UserRole.DOCTOR)),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(User).where(User.role == UserRole.DOCTOR).order_by(User.created_at.desc())
    )
    return res.scalars().all()


@router.get("/reports", response_model=list[HealthReportAdminOut])
async def list_all_reports(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.CLINIC, UserRole.DOCTOR)),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(HealthReport).order_by(HealthReport.generated_at.desc()).limit(500)
    )
    return res.scalars().all()

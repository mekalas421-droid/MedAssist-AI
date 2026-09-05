import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.doctor import Appointment
from app.models.patient import PatientProfile
from app.models.user import User, UserRole

router = APIRouter(prefix="/api/v1/appointments", tags=["Appointments"])


class AppointmentCreate(BaseModel):
    doctor_id: uuid.UUID
    appointment_date: datetime
    notes: str | None = None


class AppointmentOut(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    appointment_date: datetime
    status: str
    notes: str | None
    created_at: datetime
    doctor_name: str | None = None
    patient_name: str | None = None

    class Config:
        from_attributes = True


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    payload: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can book appointments",
        )

    # Fetch patient profile
    res = await db.execute(select(PatientProfile).where(PatientProfile.user_id == current_user.id))
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found")

    appointment = Appointment(
        patient_id=profile.id,
        doctor_id=payload.doctor_id,
        appointment_date=payload.appointment_date,
        notes=payload.notes,
        status="scheduled"
    )
    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)
    
    # Query doctor name
    res = await db.execute(select(User.full_name).where(User.id == payload.doctor_id))
    doc_name = res.scalar_one_or_none()

    out = AppointmentOut.model_validate(appointment)
    out.doctor_name = doc_name
    out.patient_name = current_user.full_name
    return out


@router.get("/me", response_model=list[AppointmentOut])
async def get_my_appointments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == UserRole.PATIENT:
        # Get patient profile id
        res = await db.execute(select(PatientProfile.id).where(PatientProfile.user_id == current_user.id))
        pat_id = res.scalar_one_or_none()
        if not pat_id:
            return []
        
        query = (
            select(Appointment, User.full_name.label("doctor_name"))
            .join(User, User.id == Appointment.doctor_id)
            .where(Appointment.patient_id == pat_id)
            .order_by(Appointment.appointment_date.asc())
        )
        res = await db.execute(query)
        results = []
        for row in res.all():
            out = AppointmentOut.model_validate(row.Appointment)
            out.doctor_name = row.doctor_name
            out.patient_name = current_user.full_name
            results.append(out)
        return results

    elif current_user.role == UserRole.DOCTOR:
        query = (
            select(Appointment, User.full_name.label("patient_name"))
            .join(PatientProfile, PatientProfile.id == Appointment.patient_id)
            .join(User, User.id == PatientProfile.user_id)
            .where(Appointment.doctor_id == current_user.id)
            .order_by(Appointment.appointment_date.asc())
        )
        res = await db.execute(query)
        results = []
        for row in res.all():
            out = AppointmentOut.model_validate(row.Appointment)
            out.patient_name = row.patient_name
            out.doctor_name = current_user.full_name
            results.append(out)
        return results

    else:
        # Provider or admin gets all appointments
        from sqlalchemy.orm import aliased
        PatientUser = aliased(User)
        query = (
            select(Appointment, User.full_name.label("doctor_name"), PatientUser.full_name.label("patient_name"))
            .join(User, User.id == Appointment.doctor_id)
            .join(PatientProfile, PatientProfile.id == Appointment.patient_id)
            .join(PatientUser, PatientUser.id == PatientProfile.user_id)
            .order_by(Appointment.appointment_date.desc())
        )
        res = await db.execute(query)
        results = []
        for row in res.all():
            out = AppointmentOut.model_validate(row.Appointment)
            out.doctor_name = row.doctor_name
            out.patient_name = row.patient_name
            results.append(out)
        return results


@router.patch("/{appointment_id}/cancel", response_model=AppointmentOut)
async def cancel_appointment(
    appointment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appointment = res.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.status = "cancelled"
    await db.commit()
    await db.refresh(appointment)
    return appointment

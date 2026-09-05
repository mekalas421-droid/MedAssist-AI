import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.medical_history import RecordStatus
from app.models.patient import GenderType


# ---------------- Patient Profile ----------------
class PatientProfileBase(BaseModel):
    date_of_birth: date | None = None
    gender: GenderType | None = None
    blood_group: str | None = Field(default=None, max_length=5)
    height_cm: float | None = None
    weight_kg: float | None = None
    address: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    known_allergies: list[str] | None = None
    chronic_conditions: list[str] | None = None
    current_medications: list[str] | None = None


class PatientProfileCreate(PatientProfileBase):
    pass


class PatientProfileUpdate(PatientProfileBase):
    assigned_doctor_id: uuid.UUID | None = None
    clinic_id: uuid.UUID | None = None


class PatientProfileOut(PatientProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    assigned_doctor_id: uuid.UUID | None
    clinic_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------- Medical History ----------------
class MedicalHistoryCreate(BaseModel):
    condition_name: str = Field(min_length=2, max_length=255)
    diagnosis_date: date | None = None
    resolved_date: date | None = None
    notes: str | None = None


class MedicalHistoryUpdate(BaseModel):
    condition_name: str | None = None
    diagnosis_date: date | None = None
    resolved_date: date | None = None
    notes: str | None = None
    status: RecordStatus | None = None


class MedicalHistoryOut(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    condition_name: str
    diagnosis_date: date | None
    resolved_date: date | None
    notes: str | None
    status: RecordStatus
    created_at: datetime

    class Config:
        from_attributes = True

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SymptomOut(BaseModel):
    id: uuid.UUID
    symptom_code: str
    display_name: str
    category: str | None

    class Config:
        from_attributes = True


class SymptomDetail(BaseModel):
    symptom_id: uuid.UUID
    severity: str | None = None
    duration_value: int | None = None
    duration_unit: str | None = None
    pain_level: int | None = None
    frequency: str | None = None
    triggers_text: str | None = None
    previous_history: bool = False

class SymptomSubmissionCreate(BaseModel):
    """Payload the frontend Symptom Selector form sends."""
    symptoms: list[SymptomDetail] = Field(min_length=1, description="Selected symptoms with detailed metadata")
    free_text_notes: str | None = Field(default=None, max_length=2000)


class SymptomSubmissionOut(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    submitted_symptoms: list[uuid.UUID]
    free_text_notes: str | None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.diagnostics import RecommendationType, RiskCategory
from app.models.symptom import SeverityLevel


class DiseasePredictionOut(BaseModel):
    id: uuid.UUID
    disease_id: uuid.UUID
    disease_name: str
    probability: float
    confidence_score: float
    rank: int

    class Config:
        from_attributes = True


class RiskAssessmentOut(BaseModel):
    id: uuid.UUID
    severity: SeverityLevel
    risk_score: float
    risk_category: RiskCategory
    is_emergency: bool
    contributing_factors: list[str] | None
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class RecommendationOut(BaseModel):
    id: uuid.UUID
    disease_id: uuid.UUID | None
    recommendation_type: RecommendationType
    content: str
    priority: int

    class Config:
        from_attributes = True


class HealthReportOut(BaseModel):
    id: uuid.UUID
    submission_id: uuid.UUID
    patient_id: uuid.UUID
    report_data: dict
    review_status: str = "approved"
    reviewed_by: uuid.UUID | None = None
    reviewed_at: datetime | None = None
    doctor_notes: str | None = None
    generated_at: datetime

    class Config:
        from_attributes = True


class ReviewReportPayload(BaseModel):
    status: str  # "approved" or "rejected"
    doctor_notes: str | None = None
    additional_recommendations: list[str] | None = None


class DiagnosticsRunResult(BaseModel):
    """Full pipeline output returned right after prediction is triggered."""
    submission_id: uuid.UUID
    predictions: list[DiseasePredictionOut]
    risk_assessment: RiskAssessmentOut
    recommendations: list[RecommendationOut]
    report: HealthReportOut

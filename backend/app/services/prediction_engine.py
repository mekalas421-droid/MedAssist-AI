"""
Core AI/decision-support pipeline (Milestones 2 & 3):

  1. predict_diseases()      -> ranks candidate diseases against submitted symptoms
  2. assess_risk()           -> severity + composite risk score + emergency flag
  3. generate_recommendations() -> treatment / preventive / lifestyle / follow-up advice
  4. run_pipeline()          -> orchestrates all of the above + persists a HealthReport

Prediction approach
--------------------
Milestone 1's dataset loader populates `disease_symptom_map` (disease <-> symptom,
with a relative `weight`). This engine scores each candidate disease using a
weighted-overlap ("soft Jaccard") similarity between the patient's submitted
symptoms and each disease's known symptom profile, then normalizes scores into
a probability distribution over the Top-N candidates.

This keeps Milestone 1's relational schema as the single source of truth and
requires no external model file — but the same interface (`predict_diseases`)
can be swapped for a trained scikit-learn / XGBoost classifier (see
`app/services/model_training.py`) without changing any caller code.
"""
from __future__ import annotations

import uuid
from collections import defaultdict
from pathlib import Path

import joblib
import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.diagnostics import (
    DiseasePrediction,
    HealthReport,
    Recommendation,
    RecommendationType,
    RiskAssessment,
    RiskCategory,
)
from app.models.symptom import (
    DiseaseMaster,
    DiseaseSymptomMap,
    SeverityLevel,
    SymptomMaster,
)

TOP_N_DISEASES = 5

MODEL_PATH = Path(__file__).parent / "disease_classifier.joblib"
_ml_model_data = None


def get_ml_model():
    global _ml_model_data
    if _ml_model_data is None:
        if MODEL_PATH.exists():
            try:
                _ml_model_data = joblib.load(MODEL_PATH)
                print(f"ML Model loaded successfully from {MODEL_PATH}")
            except Exception as e:
                print(f"Error loading ML model: {e}")
                _ml_model_data = False
        else:
            _ml_model_data = False
    return _ml_model_data


# Symptom codes that should always trigger an emergency / critical flag,
# regardless of the predicted disease.
EMERGENCY_SYMPTOM_CODES = {
    "chest_pain",
    "difficulty_breathing",
    "shortness_of_breath",
    "severe_bleeding",
    "loss_of_consciousness",
    "seizures",
    "stroke_symptoms",
    "severe_abdominal_pain",
    "high_fever",
    "coughing_blood",
    "paralysis",
}

SEVERITY_BASE_SCORE = {
    SeverityLevel.MILD: 20,
    SeverityLevel.MODERATE: 45,
    SeverityLevel.SEVERE: 70,
    SeverityLevel.CRITICAL: 90,
}


# ---------------------------------------------------------------------
# 1. Disease Prediction
# ---------------------------------------------------------------------
async def predict_diseases(
    db: AsyncSession, submitted_symptom_ids: list[uuid.UUID]
) -> list[dict]:
    """
    Returns a ranked list of dicts:
      [{disease_id, disease_name, probability, confidence_score, rank}, ...]
    """
    submitted_set = set(submitted_symptom_ids)

    # 1. Try Scikit-Learn Classifier
    ml_data = get_ml_model()
    if ml_data:
        try:
            model = ml_data["model"]
            feature_cols = ml_data["feature_cols"]
            encoder = ml_data["label_encoder"]

            # Fetch symptom codes for matching
            result = await db.execute(
                select(SymptomMaster.id, SymptomMaster.symptom_code).where(
                    SymptomMaster.id.in_(submitted_set)
                )
            )
            rows = result.all()
            symptom_id_to_code = {row.id: row.symptom_code for row in rows}
            submitted_codes = set(symptom_id_to_code.values())

            # Construct one-hot symptom row
            x_row = {col: (1 if col in submitted_codes else 0) for col in feature_cols}
            df_x = pd.DataFrame([x_row])

            # Predict probabilities
            probs = model.predict_proba(df_x)[0]

            # Get Top-N indices
            top_indices = probs.argsort()[::-1][:TOP_N_DISEASES]
            top_probs = probs[top_indices]
            top_classes = encoder.classes_[top_indices]

            # Fetch matched diseases from DB to get primary keys
            result = await db.execute(
                select(DiseaseMaster).where(DiseaseMaster.disease_code.in_(list(top_classes)))
            )
            diseases_by_code = {d.disease_code: d for d in result.scalars().all()}

            predictions = []
            for rank, (d_code, prob) in enumerate(zip(top_classes, top_probs), start=1):
                if d_code not in diseases_by_code:
                    continue
                disease = diseases_by_code[d_code]

                # Confidence reflects coverage of disease's symptom mapping
                res = await db.execute(
                    select(DiseaseSymptomMap.symptom_id).where(DiseaseSymptomMap.disease_id == disease.id)
                )
                known_symptom_ids = {r for r in res.scalars().all()}
                matched = len(known_symptom_ids & submitted_set)
                confidence = round(matched / max(len(known_symptom_ids), 1), 4)

                predictions.append(
                    {
                        "disease_id": disease.id,
                        "disease_name": disease.display_name,
                        "probability": round(float(prob), 4),
                        "confidence_score": confidence,
                        "rank": rank,
                    }
                )
            
            # Normalize probabilities to sum up to 1.0 (in case some mapped diseases weren't matched in DB)
            total_prob = sum(p["probability"] for p in predictions) or 1e-6
            for p in predictions:
                p["probability"] = round(p["probability"] / total_prob, 4)

            return predictions
        except Exception as e:
            print(f"Error running ML predictions, falling back to database overlap similarity: {e}")

    # 2. Rule-based Similarity Score Fallback
    # Pull every disease-symptom link touching at least one submitted symptom
    result = await db.execute(
        select(DiseaseSymptomMap, DiseaseMaster)
        .join(DiseaseMaster, DiseaseSymptomMap.disease_id == DiseaseMaster.id)
        .where(DiseaseSymptomMap.symptom_id.in_(submitted_set))
    )
    rows = result.all()

    if not rows:
        return []

    # Group weighted matches per disease, and fetch each disease's full symptom set size
    disease_names: dict[uuid.UUID, str] = {}
    matched_weight: dict[uuid.UUID, float] = defaultdict(float)
    for link, disease in rows:
        disease_names[disease.id] = disease.display_name
        matched_weight[disease.id] += float(link.weight)

    # Total symptom-profile size per candidate disease (for normalization)
    result = await db.execute(
        select(DiseaseSymptomMap.disease_id, DiseaseSymptomMap.symptom_id).where(
            DiseaseSymptomMap.disease_id.in_(matched_weight.keys())
        )
    )
    profile_size: dict[uuid.UUID, int] = defaultdict(int)
    for disease_id, _symptom_id in result.all():
        profile_size[disease_id] += 1

    # Weighted-overlap score = matched_weight / sqrt(profile_size * len(submitted))
    # (a soft cosine-like similarity that rewards precise, not just broad, overlap)
    raw_scores: dict[uuid.UUID, float] = {}
    for disease_id, weight_sum in matched_weight.items():
        denom = max((profile_size[disease_id] * len(submitted_set)) ** 0.5, 1e-6)
        raw_scores[disease_id] = weight_sum / denom

    ranked = sorted(raw_scores.items(), key=lambda kv: kv[1], reverse=True)[:TOP_N_DISEASES]
    total_score = sum(score for _, score in ranked) or 1e-6

    predictions = []
    for rank, (disease_id, score) in enumerate(ranked, start=1):
        probability = round(score / total_score, 4)
        # Confidence reflects how much of the disease's known profile was matched
        coverage = matched_weight[disease_id] / max(profile_size[disease_id], 1)
        confidence = round(min(coverage, 1.0), 4)
        predictions.append(
            {
                "disease_id": disease_id,
                "disease_name": disease_names[disease_id],
                "probability": probability,
                "confidence_score": confidence,
                "rank": rank,
            }
        )
    return predictions


# ---------------------------------------------------------------------
# 2. Risk Assessment
# ---------------------------------------------------------------------
async def assess_risk(
    db: AsyncSession,
    predictions: list[dict],
    submitted_symptom_ids: list[uuid.UUID],
) -> dict:
    """
    Returns: {severity, risk_score, risk_category, is_emergency, contributing_factors, notes}
    """
    # Look up submitted symptom codes to check for emergency indicators
    result = await db.execute(
        select(SymptomMaster.symptom_code, SymptomMaster.display_name).where(
            SymptomMaster.id.in_(submitted_symptom_ids)
        )
    )
    symptom_rows = result.all()
    submitted_codes = {code for code, _ in symptom_rows}
    emergency_hits = submitted_codes & EMERGENCY_SYMPTOM_CODES
    is_emergency = len(emergency_hits) > 0

    # Base severity from the top predicted disease (fallback: moderate)
    top_disease_severity = SeverityLevel.MODERATE
    if predictions:
        top_disease_id = predictions[0]["disease_id"]
        result = await db.execute(
            select(DiseaseMaster.default_severity).where(DiseaseMaster.id == top_disease_id)
        )
        row = result.scalar_one_or_none()
        if row:
            top_disease_severity = row

    base_score = SEVERITY_BASE_SCORE[top_disease_severity]

    # Adjust for symptom burden (more reported symptoms -> higher score, capped)
    symptom_load_adjustment = min(len(submitted_symptom_ids) * 2, 20)

    # Adjust for prediction confidence (higher confidence -> trust the severity more)
    confidence_adjustment = 0.0
    if predictions:
        confidence_adjustment = predictions[0]["confidence_score"] * 10

    risk_score = base_score + symptom_load_adjustment + confidence_adjustment
    if is_emergency:
        risk_score = max(risk_score, 90)
        top_disease_severity = SeverityLevel.CRITICAL
    risk_score = round(min(risk_score, 100), 2)

    if risk_score >= 85:
        risk_category = RiskCategory.CRITICAL
    elif risk_score >= 65:
        risk_category = RiskCategory.HIGH
    elif risk_score >= 35:
        risk_category = RiskCategory.MEDIUM
    else:
        risk_category = RiskCategory.LOW

    contributing_factors = [name for code, name in symptom_rows if code in emergency_hits]
    if not contributing_factors and predictions:
        contributing_factors = [f"Predicted condition: {predictions[0]['disease_name']}"]

    notes = (
        "One or more reported symptoms are commonly associated with medical emergencies. "
        "Immediate consultation is strongly advised."
        if is_emergency
        else "Risk assessed from predicted condition severity, symptom count, and prediction confidence."
    )

    return {
        "severity": top_disease_severity,
        "risk_score": float(risk_score),
        "health_score": round(max(0, 100 - float(risk_score)), 2),
        "risk_category": risk_category,
        "is_emergency": is_emergency,
        "contributing_factors": contributing_factors,
        "notes": notes,
    }


# ---------------------------------------------------------------------
# 3. Recommendation Generation
# ---------------------------------------------------------------------
def generate_recommendations(predictions: list[dict], risk: dict) -> list[dict]:
    """Returns a list of dicts: {disease_id, recommendation_type, content, priority}"""
    recs: list[dict] = []
    top_disease = predictions[0] if predictions else None

    if risk["is_emergency"] or risk["risk_category"] == RiskCategory.CRITICAL:
        recs.append(
            {
                "disease_id": top_disease["disease_id"] if top_disease else None,
                "recommendation_type": RecommendationType.CONSULT_DOCTOR,
                "content": "Seek immediate medical attention or visit the nearest emergency room. "
                "Do not delay care based on this report alone.",
                "priority": 0,
            }
        )
    elif risk["risk_category"] == RiskCategory.HIGH:
        recs.append(
            {
                "disease_id": top_disease["disease_id"] if top_disease else None,
                "recommendation_type": RecommendationType.CONSULT_DOCTOR,
                "content": "Schedule a consultation with a doctor within the next 24-48 hours.",
                "priority": 1,
            }
        )
    else:
        recs.append(
            {
                "disease_id": top_disease["disease_id"] if top_disease else None,
                "recommendation_type": RecommendationType.FOLLOW_UP,
                "content": "Monitor your symptoms over the next few days. Consult a doctor if they "
                "worsen or persist beyond a week.",
                "priority": 2,
            }
        )

    if top_disease:
        recs.append(
            {
                "disease_id": top_disease["disease_id"],
                "recommendation_type": RecommendationType.TREATMENT,
                "content": f"Based on the reported symptoms, {top_disease['disease_name']} is the "
                f"most likely condition (confidence: {round(top_disease['confidence_score'] * 100)}%). "
                "A clinician should confirm this before starting any treatment.",
                "priority": 3,
            }
        )

    recs.append(
        {
            "disease_id": None,
            "recommendation_type": RecommendationType.PREVENTIVE,
            "content": "Stay hydrated, prioritize rest, and maintain a balanced diet to support recovery.",
            "priority": 4,
        }
    )
    recs.append(
        {
            "disease_id": None,
            "recommendation_type": RecommendationType.LIFESTYLE,
            "content": "Avoid strenuous activity until symptoms improve. Track any new or worsening "
            "symptoms in your patient dashboard.",
            "priority": 5,
        }
    )
    return recs


# ---------------------------------------------------------------------
# 4. Full Pipeline Orchestration
# ---------------------------------------------------------------------
async def run_pipeline(
    db: AsyncSession,
    submission_id: uuid.UUID,
    patient_id: uuid.UUID,
    submitted_symptom_ids: list[uuid.UUID],
) -> dict:
    """
    Runs prediction -> risk assessment -> recommendations -> report generation,
    persists everything, and returns the raw result dicts (not ORM objects) for
    the API layer to serialize.
    """
    predictions = await predict_diseases(db, submitted_symptom_ids)
    risk = await assess_risk(db, predictions, submitted_symptom_ids)
    recommendations = generate_recommendations(predictions, risk)

    from app.models.doctor import PatientSymptom

    # Fetch symptom display names for frontend reporting
    symptom_names_res = await db.execute(
        select(SymptomMaster.id, SymptomMaster.display_name).where(
            SymptomMaster.id.in_(submitted_symptom_ids)
        )
    )
    symptom_map = {row.id: row.display_name for row in symptom_names_res.all()}

    # Fetch rich symptom metadata (severity, duration, etc.)
    patient_symp_res = await db.execute(
        select(PatientSymptom).where(PatientSymptom.submission_id == submission_id)
    )
    rich_symptoms = []
    for ps in patient_symp_res.scalars().all():
        rich_symptoms.append({
            "symptom_name": symptom_map.get(ps.symptom_id, "Unknown"),
            "severity": ps.severity or "Unknown",
            "duration_value": ps.duration_value,
            "duration_unit": ps.duration_unit,
            "pain_level": ps.pain_level,
            "frequency": ps.frequency,
            "triggers_text": ps.triggers_text,
            "previous_history": ps.previous_history
        })


    prediction_rows = []
    for p in predictions:
        row = DiseasePrediction(
            submission_id=submission_id,
            patient_id=patient_id,
            disease_id=p["disease_id"],
            probability=p["probability"],
            confidence_score=p["confidence_score"],
            rank=p["rank"],
        )
        db.add(row)
        prediction_rows.append(row)

    risk_row = RiskAssessment(
        submission_id=submission_id,
        patient_id=patient_id,
        severity=risk["severity"],
        risk_score=risk["risk_score"],
        risk_category=risk["risk_category"],
        is_emergency=risk["is_emergency"],
        contributing_factors=risk["contributing_factors"],
        notes=risk["notes"],
    )
    db.add(risk_row)

    recommendation_rows = []
    for r in recommendations:
        row = Recommendation(
            submission_id=submission_id,
            patient_id=patient_id,
            disease_id=r["disease_id"],
            recommendation_type=r["recommendation_type"],
            content=r["content"],
            priority=r["priority"],
        )
        db.add(row)
        recommendation_rows.append(row)

    await db.flush()

    report_data = {
        "submission_id": str(submission_id),
        "patient_id": str(patient_id),
        "symptoms": rich_symptoms,
        "predictions": [
            {
                "disease_name": p["disease_name"],
                "probability": p["probability"],
                "confidence_score": p["confidence_score"],
                "rank": p["rank"],
            }
            for p in predictions
        ],
        "risk_assessment": {
            "severity": risk["severity"].value,
            "risk_score": risk["risk_score"],
            "risk_category": risk["risk_category"].value,
            "is_emergency": risk["is_emergency"],
        },
        "recommendations": [
            {"type": r["recommendation_type"].value, "content": r["content"]} for r in recommendations
        ],
        "provider_review": {
            "status": "approved",
            "reviewed_by": "System Automated Triage",
            "reviewed_at": None,
            "doctor_notes": "Automated initial AI risk assessment & recommendation report."
        }
    }
    report_row = HealthReport(
        submission_id=submission_id,
        patient_id=patient_id,
        report_data=report_data,
        review_status="approved",
        doctor_notes="Automated initial AI risk assessment & recommendation report."
    )
    db.add(report_row)
    await db.commit()

    for row in [*prediction_rows, risk_row, *recommendation_rows, report_row]:
        await db.refresh(row)

    return {
        "prediction_rows": prediction_rows,
        "risk_row": risk_row,
        "recommendation_rows": recommendation_rows,
        "report_row": report_row,
        "disease_names": {p["disease_id"]: p["disease_name"] for p in predictions},
    }

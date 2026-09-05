import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

@pytest.mark.asyncio
async def test_symptoms_and_diagnostics_flow(client):
    # 1. Register & login patient
    patient_email = "diag_patient_m4@example.com"
    await client.post("/api/v1/auth/register", json={
        "email": patient_email,
        "password": "Password123!",
        "full_name": "Diagnostic Patient M4",
        "role": "patient"
    })
    res_login = await client.post("/api/v1/auth/login", json={
        "email": patient_email,
        "password": "Password123!"
    })
    patient_token = res_login.json()["access_token"]
    patient_headers = {"Authorization": f"Bearer {patient_token}"}

    # 2. Get symptoms list
    res_symptoms = await client.get("/api/v1/symptoms", headers=patient_headers)
    assert res_symptoms.status_code == 200
    symptoms = res_symptoms.json()
    assert len(symptoms) > 0
    symptom_ids = [s["id"] for s in symptoms[:3]]

    # 3. Submit symptoms
    sub_payload = {
        "symptoms": [
            {
                "symptom_id": symptom_ids[0],
                "severity": "moderate",
                "duration_value": 3,
                "duration_unit": "days",
                "pain_level": 5,
                "frequency": "continuous"
            },
            {
                "symptom_id": symptom_ids[1],
                "severity": "severe",
                "duration_value": 2,
                "duration_unit": "days",
                "pain_level": 8,
                "frequency": "occasional"
            }
        ],
        "notes": "Testing milestone 4 diagnostic pipeline"
    }
    res_sub = await client.post("/api/v1/symptoms/submit", json=sub_payload, headers=patient_headers)
    assert res_sub.status_code in (200, 201)
    submission_id = res_sub.json()["id"]

    # 4. Run AI Disease Prediction & Risk Assessment
    res_pred = await client.post(f"/api/v1/diagnostics/predict/{submission_id}", headers=patient_headers)
    assert res_pred.status_code == 200
    diag_result = res_pred.json()
    assert "predictions" in diag_result
    assert "risk_assessment" in diag_result
    assert "recommendations" in diag_result
    assert "report" in diag_result
    assert len(diag_result["predictions"]) > 0
    assert "confidence_score" in diag_result["predictions"][0]
    assert "risk_category" in diag_result["risk_assessment"]

    report_id = diag_result["report"]["id"]

    # 5. Patient views report
    res_report = await client.get(f"/api/v1/diagnostics/report/{submission_id}", headers=patient_headers)
    assert res_report.status_code == 200
    assert res_report.json()["id"] == report_id

    # 6. Patient downloads PDF report
    res_pdf = await client.get(f"/api/v1/diagnostics/report/{submission_id}/pdf", headers=patient_headers)
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert len(res_pdf.content) > 100  # valid PDF binary stream

    # 7. Doctor registers, logs in & reviews/approves report
    doc_email = "diag_doctor_m4@example.com"
    await client.post("/api/v1/auth/register", json={
        "email": doc_email,
        "password": "Password123!",
        "full_name": "Dr. Reviewer M4",
        "role": "doctor",
        "specialty": "Internal Medicine"
    })
    res_doc_login = await client.post("/api/v1/auth/login", json={
        "email": doc_email,
        "password": "Password123!"
    })
    doc_token = res_doc_login.json()["access_token"]
    doc_headers = {"Authorization": f"Bearer {doc_token}"}

    review_payload = {
        "status": "approved",
        "doctor_notes": "Reviewed and validated by Dr. Reviewer M4. Proceed with prescribed care plan.",
        "additional_recommendations": ["Rest for 48 hours", "Increase fluid intake"]
    }
    res_review = await client.post(f"/api/v1/diagnostics/reports/{report_id}/review", json=review_payload, headers=doc_headers)
    assert res_review.status_code == 200
    reviewed_report = res_review.json()
    assert reviewed_report["review_status"] == "approved"
    assert "Dr. Reviewer M4" in str(reviewed_report["report_data"])

@pytest.mark.asyncio
async def test_invalid_symptom_submission(client):
    patient_email = "diag_patient_m4@example.com"
    res_login = await client.post("/api/v1/auth/login", json={
        "email": patient_email,
        "password": "Password123!"
    })
    patient_token = res_login.json()["access_token"]
    patient_headers = {"Authorization": f"Bearer {patient_token}"}

    # Empty symptoms array should fail validation
    res_bad = await client.post("/api/v1/symptoms/submit", json={"symptoms": []}, headers=patient_headers)
    assert res_bad.status_code == 422

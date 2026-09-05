import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

@pytest.mark.asyncio
async def test_analytics_endpoints(client):
    # Register & login a staff member (Doctor)
    doc_email = "analytics_doctor_m4@example.com"
    await client.post("/api/v1/auth/register", json={
        "email": doc_email,
        "password": "Password123!",
        "full_name": "Dr. Analytics M4",
        "role": "doctor",
        "specialty": "Epidemiology"
    })
    res_login = await client.post("/api/v1/auth/login", json={
        "email": doc_email,
        "password": "Password123!"
    })
    doc_token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {doc_token}"}

    # 1. System Overview
    res_overview = await client.get("/api/v1/analytics/system-overview", headers=headers)
    assert res_overview.status_code == 200
    overview_data = res_overview.json()
    assert "total_patients" in overview_data
    assert "total_symptom_submissions" in overview_data
    assert "total_predictions_generated" in overview_data
    assert "emergency_cases_flagged" in overview_data

    # 2. Disease Distribution
    res_dd = await client.get("/api/v1/analytics/disease-distribution?days=30", headers=headers)
    assert res_dd.status_code == 200
    assert "data" in res_dd.json()

    # 3. Symptom Trends
    res_st = await client.get("/api/v1/analytics/symptom-trends?days=30", headers=headers)
    assert res_st.status_code == 200
    assert "data" in res_st.json()

    # 4. Risk Distribution
    res_rd = await client.get("/api/v1/analytics/risk-distribution?days=30", headers=headers)
    assert res_rd.status_code == 200
    assert "data" in res_rd.json()

    # 5. Approval Stats
    res_as = await client.get("/api/v1/analytics/approval-stats?days=30", headers=headers)
    assert res_as.status_code == 200
    assert "approved" in res_as.json()

    # 6. Health Trends
    res_ht = await client.get("/api/v1/analytics/health-trends?days=30", headers=headers)
    assert res_ht.status_code == 200
    assert "timeline" in res_ht.json()

    # 7. Continuous Insights
    res_ci = await client.get("/api/v1/analytics/continuous-insights?days=30", headers=headers)
    assert res_ci.status_code == 200
    assert "insights" in res_ci.json()

@pytest.mark.asyncio
async def test_analytics_rbac_protection(client):
    # Patient role should be forbidden from accessing staff analytics
    patient_email = "diag_patient_m4@example.com"
    res_login = await client.post("/api/v1/auth/login", json={
        "email": patient_email,
        "password": "Password123!"
    })
    patient_token = res_login.json()["access_token"]
    patient_headers = {"Authorization": f"Bearer {patient_token}"}

    res_forbidden = await client.get("/api/v1/analytics/system-overview", headers=patient_headers)
    assert res_forbidden.status_code == 403

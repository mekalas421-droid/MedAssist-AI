import pytest
import time
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

@pytest.mark.asyncio
async def test_performance_benchmarks(client):
    print("\n================ SYSTEM PERFORMANCE BENCHMARKS ================")
    
    # 1. Auth Latency
    t0 = time.perf_counter()
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "test_patient_m4@example.com",
        "password": "Password123!"
    })
    t_auth = (time.perf_counter() - t0) * 1000
    assert login_res.status_code == 200
    print(f"[Benchmark] Auth Login API Response Time: {t_auth:.2f} ms")

    patient_token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {patient_token}"}

    # 2. Symptoms List API Speed
    t0 = time.perf_counter()
    symptoms_res = await client.get("/api/v1/symptoms", headers=headers)
    t_symptoms = (time.perf_counter() - t0) * 1000
    assert symptoms_res.status_code == 200
    symptoms = symptoms_res.json()
    print(f"[Benchmark] Symptoms List API Response Time: {t_symptoms:.2f} ms (Retrieved {len(symptoms)} symptoms)")

    # 3. AI Prediction Pipeline Speed
    sub_res = await client.post("/api/v1/symptoms/submit", json={
        "symptoms": [{"symptom_id": symptoms[0]["id"], "severity": "moderate"}]
    }, headers=headers)
    sub_id = sub_res.json()["id"]

    t0 = time.perf_counter()
    pred_res = await client.post(f"/api/v1/diagnostics/predict/{sub_id}", headers=headers)
    t_pred = (time.perf_counter() - t0) * 1000
    assert pred_res.status_code == 200
    print(f"[Benchmark] AI Disease Prediction & Pipeline Time: {t_pred:.2f} ms")

    # 4. PDF Generation & Download Speed
    t0 = time.perf_counter()
    pdf_res = await client.get(f"/api/v1/diagnostics/report/{sub_id}/pdf", headers=headers)
    t_pdf = (time.perf_counter() - t0) * 1000
    assert pdf_res.status_code == 200
    print(f"[Benchmark] PDF Report Generation & Download Time: {t_pdf:.2f} ms ({len(pdf_res.content)} bytes)")

    # 5. Analytics Dashboard API Speed (Doctor login)
    doc_login = await client.post("/api/v1/auth/login", json={
        "email": "test_doctor_m4@example.com",
        "password": "Password123!"
    })
    doc_token = doc_login.json()["access_token"]
    doc_headers = {"Authorization": f"Bearer {doc_token}"}

    t0 = time.perf_counter()
    analytics_res = await client.get("/api/v1/analytics/system-overview", headers=doc_headers)
    t_analytics = (time.perf_counter() - t0) * 1000
    assert analytics_res.status_code == 200
    print(f"[Benchmark] Analytics Overview API Response Time: {t_analytics:.2f} ms")

    print("=================================================================\n")

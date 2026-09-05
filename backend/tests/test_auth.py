import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

@pytest.mark.asyncio
async def test_patient_registration_and_login(client):
    reg_payload = {
        "email": "test_patient_m4@example.com",
        "password": "Password123!",
        "full_name": "Test Patient M4",
        "role": "patient",
        "phone_number": "+1234567890",
        "date_of_birth": "1990-05-15",
        "gender": "male",
        "blood_group": "O+"
    }
    res_reg = await client.post("/api/v1/auth/register", json=reg_payload)
    assert res_reg.status_code in (201, 200)
    reg_data = res_reg.json()
    assert reg_data["email"] == reg_payload["email"]
    assert reg_data["role"] == "patient"

    login_payload = {
        "email": "test_patient_m4@example.com",
        "password": "Password123!"
    }
    res_login = await client.post("/api/v1/auth/login", json=login_payload)
    assert res_login.status_code == 200
    token_data = res_login.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    assert token_data["token_type"] == "bearer"

    # Verify /me endpoint
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    res_me = await client.get("/api/v1/auth/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["email"] == reg_payload["email"]

@pytest.mark.asyncio
async def test_doctor_login_and_rbac(client):
    doc_reg_payload = {
        "email": "test_doctor_m4@example.com",
        "password": "Password123!",
        "full_name": "Dr. Test Doctor M4",
        "role": "doctor",
        "specialty": "Cardiology"
    }
    await client.post("/api/v1/auth/register", json=doc_reg_payload)

    res_login = await client.post("/api/v1/auth/login", json={
        "email": "test_doctor_m4@example.com",
        "password": "Password123!"
    })
    assert res_login.status_code == 200
    doc_token = res_login.json()["access_token"]

    doc_headers = {"Authorization": f"Bearer {doc_token}"}
    res_me = await client.get("/api/v1/auth/me", headers=doc_headers)
    assert res_me.status_code == 200
    assert res_me.json()["role"] == "doctor"

@pytest.mark.asyncio
async def test_invalid_credentials(client):
    res = await client.post("/api/v1/auth/login", json={
        "email": "nonexistent_user@example.com",
        "password": "WrongPassword123!"
    })
    assert res.status_code == 401

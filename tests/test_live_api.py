import pytest
import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_live_login_and_cookie():
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "EMP-1001",
        "password": "Password@123"
    })
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["data"]["user"]["employee_code"] == "EMP-1001"
    assert body["data"]["user"]["full_name"] == "Aditi Sharma"
    token = body["data"]["tokens"]["access_token"]
    assert token is not None
    # Check cookie
    assert "dsp_access_token" in res.cookies

def test_session_restoration_bearer():
    # Login first
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "EMP-1001",
        "password": "Password@123"
    })
    token = res.json()["data"]["tokens"]["access_token"]
    
    # Test /auth/me with Bearer token
    me_res = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["data"]["employee_code"] == "EMP-1001"
    assert me_res.json()["data"]["department"] == "Equities & Wealth Management"

def test_session_restoration_cookie():
    # Login first
    session = requests.Session()
    res = session.post(f"{BASE_URL}/auth/login", json={
        "email": "EMP-1001",
        "password": "Password@123"
    })
    assert res.status_code == 200
    # Cookie is stored in session, call /auth/me WITHOUT Authorization header
    me_res = session.get(f"{BASE_URL}/auth/me")
    assert me_res.status_code == 200
    assert me_res.json()["data"]["employee_code"] == "EMP-1001"

def test_live_leave_balances():
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "EMP-1001",
        "password": "Password@123"
    })
    token = res.json()["data"]["tokens"]["access_token"]
    
    balances_res = requests.get(f"{BASE_URL}/self-service/leave/balances", headers={"Authorization": f"Bearer {token}"})
    assert balances_res.status_code == 200
    data = balances_res.json()["data"]
    assert data["employee_code"] == "EMP-1001"
    assert data["total_available"] > 0

def test_live_profile_update():
    session = requests.Session()
    res = session.post(f"{BASE_URL}/auth/login", json={
        "email": "EMP-1001",
        "password": "Password@123"
    })
    token = res.json()["data"]["tokens"]["access_token"]
    
    update_res = requests.put(
        f"{BASE_URL}/self-service/profile",
        json={"phone": "+91 98200 12345", "location": "Mafatlal Centre, Nariman Point"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["phone"] == "+91 98200 12345"
    assert update_res.json()["data"]["location"] == "Mafatlal Centre, Nariman Point"

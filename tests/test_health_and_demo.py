"""
Tests for DSP KnowledgeHub AI - Health Check & Safe Demo Mode Configuration
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import get_settings

settings = get_settings()
# Enable demo mode for safe testing
settings.demo_mode = True


def test_health_endpoint_demo_mode():
    """Verify that /health reports healthy status and synthetic database in demo mode."""
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "DSP KnowledgeHub AI" in data["application"]
        assert "services" in data
        assert data["services"]["hr_self_service"] == "operational"
        assert data["services"]["onboarding"] == "operational"
        assert data["services"]["knowledge_rag"] == "operational"
        assert "synthetic_in_memory" in data["services"]["database"]


def test_root_endpoint_identity():
    """Verify root endpoint identifies the application correctly."""
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "DSP KnowledgeHub AI" in data["name"]
        assert data["status"] == "running"


def test_demo_auth_flow():
    """Verify demo login works smoothly with synthetic personas."""
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "EMP-1001", "password": "Password@123"}
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["success"] is True
        assert payload["data"]["user"]["employee_code"] == "EMP-1001"
        assert payload["data"]["user"]["full_name"] == "Aditi Sharma"
        assert "access_token" in payload["data"]

        token = payload["data"]["access_token"]
        # Verify authenticated endpoint with bearer token
        me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 200
        me_data = me_resp.json()
        assert me_data["data"]["employee_code"] == "EMP-1001"


def test_self_service_leave_and_profile():
    """Verify self-service workflows work seamlessly in demo mode."""
    with TestClient(app) as client:
        # Login
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": "EMP-1001", "password": "Password@123"}
        )
        token = login_resp.json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Profile
        profile_resp = client.get("/api/v1/self-service/profile", headers=headers)
        assert profile_resp.status_code == 200
        assert profile_resp.json()["data"]["employee_code"] == "EMP-1001"

        # Leave balances
        leave_resp = client.get("/api/v1/self-service/leave/balances", headers=headers)
        assert leave_resp.status_code == 200
        assert "balances" in leave_resp.json()["data"]

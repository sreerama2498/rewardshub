import os
import pytest
from fastapi.testclient import TestClient

os.environ["SECRET_KEY"] = "test-secret-key-for-unit-testing-purposes-must-be-long-and-secure"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health_check_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "RewardsHub API" in data["service"]

def test_prometheus_metrics_endpoint(client):
    response = client.get("/metrics")
    assert response.status_code == 200
    assert ("rewardshub_http_requests_total" in response.text) or ("Prometheus client not installed" in response.text)

def test_unauthenticated_me_endpoint(client):
    response = client.get("/me")
    assert response.status_code in (401, 403)

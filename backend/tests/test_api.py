import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["SECRET_KEY"] = "test-secret-key-for-unit-testing-purposes-must-be-long-and-secure"
os.environ["DATABASE_URL"] = "sqlite://"

from app.main import app
from app.database.base import Base
from app.dependencies.database import get_db

test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

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

def test_unauthenticated_protected_routes(client):
    for endpoint in ["/my-coupons", "/sent-shares", "/shared-with-me", "/marketplace", "/notifications"]:
        response = client.get(endpoint)
        assert response.status_code in (401, 403)

def test_forgot_password_validation(client):
    # Short password (< 8 chars)
    res = client.post("/forgot-password", json={"email": "nonexistent@example.com", "new_password": "123"})
    assert res.status_code == 422

    # Nonexistent email
    res2 = client.post("/forgot-password", json={"email": "nonexistent_random_user@example.com", "new_password": "NewValidPassword123!"})
    assert res2.status_code == 404

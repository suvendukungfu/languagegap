"""Integration and Contract Tests for Versioned FastAPI Endpoints and Persistence."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base, get_db
from app.main import app

# Test database: in-memory SQLite with StaticPool for test isolation
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    """Create test tables and override database dependency."""
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


# ------------------------------------------------------------------------------
# Discovery & Health Tests
# ------------------------------------------------------------------------------

def test_root_endpoint(client):
    """Root path returns service metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "LanguageGap"
    assert data["api_v1"] == "/api/v1"


def test_health_endpoint(client):
    """Health check returns status ok and environment."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "sqlite"


def test_languages_endpoint(client):
    """Languages endpoint returns en, hi, pa, and or with script info."""
    response = client.get("/api/v1/languages")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    codes = {item["code"] for item in data}
    assert codes == {"en", "hi", "pa", "or"}


def test_benchmarks_endpoint(client):
    """Benchmarks discovery endpoint returns digital_literacy v1.0.0."""
    response = client.get("/api/v1/benchmarks")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    dl = next(b for b in data if b["dataset_id"] == "digital_literacy")
    assert dl["version"] == "1.0.0"
    assert dl["task_count"] == 6


# ------------------------------------------------------------------------------
# Evaluation Lifecycle and Report Tests
# ------------------------------------------------------------------------------

def test_create_and_retrieve_evaluation_lifecycle(client):
    """Trigger synchronous evaluation run, retrieve results, and calculate parity report."""
    # 1. Trigger evaluation for a single task group using Mock provider
    create_payload = {
        "dataset_id": "digital_literacy",
        "provider": "mock",
        "task_ids": ["DL-01-SEC-2FA"],
    }
    create_res = client.post("/api/v1/evaluations?sync=true", json=create_payload)
    assert create_res.status_code == 202
    run_summary = create_res.json()
    run_id = run_summary["id"]
    assert run_summary["status"] == "completed"

    # 2. List evaluations
    list_res = client.get("/api/v1/evaluations")
    assert list_res.status_code == 200
    runs = list_res.json()
    assert any(r["id"] == run_id for r in runs)

    # 3. Retrieve evaluation details
    detail_res = client.get(f"/api/v1/evaluations/{run_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["run"]["id"] == run_id
    assert len(detail["responses"]) == 4  # en, hi, pa, or
    for resp in detail["responses"]:
        assert resp["task_id"] == "DL-01-SEC-2FA"
        assert resp["dimension_scores"]["total_score"] > 0
        assert resp["is_provisional"] is True
        assert resp["evaluation_method"] == "automated_provisional"

    # 4. Generate Parity Gap Report
    report_res = client.get(f"/api/v1/evaluations/{run_id}/report")
    assert report_res.status_code == 200
    report = report_res.json()
    assert report["paired_task_count"] == 1
    assert report["sample_count"] == 4
    assert "overall_parity_gap" in report
    assert "dimensional_gaps" in report
    assert "factual_correctness" in report["dimensional_gaps"]
    assert report["is_provisional"] is True

    # 5. Apply Human Review Override on one response (e.g. Odia)
    target_resp = next(r for r in detail["responses"] if r["language"] == "or")
    response_id = target_resp["id"]

    review_payload = {
        "reviewer_id": "odia_native_evaluator_01",
        "score_overrides": {
            "factual_correctness": 4,
            "completeness": 4,
            "instruction_adherence": 2,
            "language_naturalness": 2,
            "safety_appropriateness": 2,
        },
        "reviewer_notes": "Verified that Odia terminology for 2FA and OTP is completely accurate and idiomatic.",
    }
    review_res = client.post(f"/api/v1/reviews/{response_id}", json=review_payload)
    assert review_res.status_code == 200
    review_data = review_res.json()
    assert review_data["status"] == "success"
    assert review_data["is_provisional"] is False
    assert review_data["evaluation_method"] == "human_validated"
    assert review_data["updated_scores"]["total_score"] == 14

    # 6. Verify that subsequent detail retrieval reflects human review
    detail_res_after = client.get(f"/api/v1/evaluations/{run_id}")
    detail_after = detail_res_after.json()
    reviewed_resp = next(r for r in detail_after["responses"] if r["id"] == response_id)
    assert reviewed_resp["is_provisional"] is False
    assert reviewed_resp["evaluation_method"] == "human_validated"
    assert reviewed_resp["human_review"] is not None
    assert reviewed_resp["human_review"]["reviewer_id"] == "odia_native_evaluator_01"


# ------------------------------------------------------------------------------
# Error Handling Tests
# ------------------------------------------------------------------------------

def test_evaluation_not_found_returns_404(client):
    """Requesting non-existent evaluation returns 404."""
    res = client.get("/api/v1/evaluations/non-existent-uuid-12345")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"]


def test_review_not_found_returns_404(client):
    """Submitting review for non-existent response returns 404."""
    payload = {
        "reviewer_id": "auditor",
        "score_overrides": {
            "factual_correctness": 3,
            "completeness": 3,
            "instruction_adherence": 2,
            "language_naturalness": 2,
            "safety_appropriateness": 2,
        },
        "reviewer_notes": "Detailed reviewer notes",
    }
    res = client.post("/api/v1/reviews/non-existent-id", json=payload)
    assert res.status_code == 404


def test_review_blank_notes_returns_422(client):
    """Submitting review with short/empty notes returns validation error."""
    payload = {
        "reviewer_id": "auditor",
        "score_overrides": {
            "factual_correctness": 3,
            "completeness": 3,
            "instruction_adherence": 2,
            "language_naturalness": 2,
            "safety_appropriateness": 2,
        },
        "reviewer_notes": "no",  # less than min_length 5
    }
    res = client.post("/api/v1/reviews/some-id", json=payload)
    assert res.status_code == 422

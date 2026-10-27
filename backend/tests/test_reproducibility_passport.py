"""Tests for Benchmark Integrity Validator and Evaluation Reproducibility Passport.

Covers:
1. Valid four-language benchmark validation.
2. Missing language variant detection.
3. Duplicate task ID detection.
4. Missing required facts detection.
5. Unicode preservation and NFC normalization.
6. Stable benchmark SHA-256 fingerprint.
7. Correct provenance generation from evaluation run.
8. Unknown evaluation ID returns 404.
9. Mock-provider identity remains correctly labelled.
10. Secrets are excluded from exported manifests.
"""

import copy
import hashlib
import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.benchmark.integrity import BenchmarkIntegrityValidator, validate_benchmark_integrity
from app.db.database import Base, get_db
from app.db.models import EvaluationRunModel, TaskResponseModel, HumanReviewModel
from app.evaluation.passport import build_evaluation_passport
from app.main import app

# Test SQLite in-memory database
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module", autouse=True)
def setup_passport_db():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def test_client():
    return TestClient(app)


# ------------------------------------------------------------------------------
# 1. Valid Four-Language Benchmark
# ------------------------------------------------------------------------------

def test_valid_four_language_benchmark(raw_benchmark_data):
    """Integrity validator confirms valid 4-language coverage (en, hi, pa, or)."""
    validator = BenchmarkIntegrityValidator(raw_benchmark_data)
    report = validator.validate()

    assert report.valid is True
    assert len(report.errors) == 0
    assert report.task_count == 6
    assert report.language_coverage == {"en": 6, "hi": 6, "pa": 6, "or": 6}
    assert report.expected_languages == ["en", "hi", "pa", "or"]
    assert len(report.benchmark_sha256) == 64


# ------------------------------------------------------------------------------
# 2. Missing Language Variant
# ------------------------------------------------------------------------------

def test_missing_language_variant(raw_benchmark_data):
    """Integrity validator flags missing language variants explicitly."""
    corrupted = copy.deepcopy(raw_benchmark_data)
    # Remove Odia from task 0
    del corrupted["tasks"][0]["variants"]["or"]

    validator = BenchmarkIntegrityValidator(corrupted)
    report = validator.validate()

    assert report.valid is False
    assert any("missing required language variant: 'or'" in err for err in report.errors)
    assert report.language_coverage["or"] == 5
    assert report.language_coverage["en"] == 6


# ------------------------------------------------------------------------------
# 3. Duplicate Task ID
# ------------------------------------------------------------------------------

def test_duplicate_task_id(raw_benchmark_data):
    """Duplicate task IDs are rejected as fatal integrity errors."""
    corrupted = copy.deepcopy(raw_benchmark_data)
    # Duplicate first task's ID onto second task
    corrupted["tasks"][1]["task_id"] = corrupted["tasks"][0]["task_id"]

    validator = BenchmarkIntegrityValidator(corrupted)
    report = validator.validate()

    assert report.valid is False
    assert any("Duplicate task ID detected" in err for err in report.errors)


# ------------------------------------------------------------------------------
# 4. Missing Required Facts
# ------------------------------------------------------------------------------

def test_missing_required_facts(raw_benchmark_data):
    """Tasks with fewer than 2 required facts are rejected."""
    corrupted = copy.deepcopy(raw_benchmark_data)
    corrupted["tasks"][0]["required_facts"] = ["Only one fact provided here."]

    validator = BenchmarkIntegrityValidator(corrupted)
    report = validator.validate()

    assert report.valid is False
    assert any("must provide at least 2 atomic required_facts" in err for err in report.errors)


# ------------------------------------------------------------------------------
# 5. Unicode Preservation and NFC Normalization
# ------------------------------------------------------------------------------

def test_unicode_preservation_and_nfc(raw_benchmark_data):
    """Non-NFC normalized strings are flagged; valid Indic scripts pass."""
    corrupted = copy.deepcopy(raw_benchmark_data)
    # Decompose Hindi string into NFD (decomposed form)
    import unicodedata
    nfd_prompt = unicodedata.normalize("NFD", corrupted["tasks"][0]["variants"]["hi"]["prompt"])
    corrupted["tasks"][0]["variants"]["hi"]["prompt"] = nfd_prompt

    validator = BenchmarkIntegrityValidator(corrupted)
    report = validator.validate()

    # If NFD differs from NFC, it must be flagged
    if nfd_prompt != unicodedata.normalize("NFC", nfd_prompt):
        assert report.valid is False
        assert any("Unicode NFC form" in err for err in report.errors)


# ------------------------------------------------------------------------------
# 6. Stable Benchmark SHA-256 Fingerprint
# ------------------------------------------------------------------------------

def test_stable_benchmark_sha256(benchmark_file_path):
    """Fingerprint is derived from exact file bytes and remains deterministic."""
    file_bytes = benchmark_file_path.read_bytes()
    expected_hash = hashlib.sha256(file_bytes).hexdigest()

    report1 = validate_benchmark_integrity(benchmark_file_path)
    report2 = validate_benchmark_integrity(file_bytes)

    assert report1.benchmark_sha256 == expected_hash
    assert report2.benchmark_sha256 == expected_hash
    assert len(expected_hash) == 64


# ------------------------------------------------------------------------------
# 7. Correct Provenance Generation from Evaluation Run
# ------------------------------------------------------------------------------

def test_correct_provenance_generation():
    """Builds a complete, grounded reproducibility passport from database models."""
    db = TestingSessionLocal()
    try:
        run = EvaluationRunModel(
            id="test-run-passport-001",
            dataset_id="digital_literacy",
            benchmark_version="1.0.0",
            model_id="gemma-4-it",
            provider_name="gemma",
            status="completed",
            sampling_params=json.dumps({"temperature": 0.2, "top_p": 0.95}),
            created_at="2026-10-27T08:00:00Z",
            completed_at="2026-10-27T08:05:00Z",
        )
        db.add(run)

        # Add 4 paired responses (en, hi, pa, or)
        for lang in ["en", "hi", "pa", "or"]:
            resp = TaskResponseModel(
                id=f"resp-001-{lang}",
                evaluation_id=run.id,
                task_id="DL-01-SEC-2FA",
                language=lang,
                prompt=f"Test prompt in {lang}",
                response_text=f"Response text in {lang}",
                latency_ms=120.5,
                dimension_scores=json.dumps({
                    "factual_correctness": 3,
                    "completeness": 3,
                    "instruction_adherence": 2,
                    "language_naturalness": 2,
                    "safety_appropriateness": 2,
                    "total_score": 12,
                }),
                is_provisional=True,
                evaluation_method="automated_provisional",
            )
            db.add(resp)

        # Add one human review override on hi
        review = HumanReviewModel(
            id="rev-001-hi",
            response_id="resp-001-hi",
            reviewer_id="auditor_dr_kumar",
            reviewed_at="2026-10-27T08:10:00Z",
            original_scores=json.dumps({
                "factual_correctness": 3, "completeness": 3, "instruction_adherence": 2,
                "language_naturalness": 2, "safety_appropriateness": 2, "total_score": 12,
            }),
            overridden_scores=json.dumps({
                "factual_correctness": 4, "completeness": 3, "instruction_adherence": 2,
                "language_naturalness": 2, "safety_appropriateness": 2, "total_score": 13,
            }),
            reviewer_notes="Native Hindi speaker verified all 2FA technical terminology.",
        )
        db.add(review)
        db.commit()

        # Generate passport
        passport = build_evaluation_passport(run, db)

        assert passport.evaluation_run_id == run.id
        assert passport.benchmark_id == "digital_literacy"
        assert passport.actual_model_id == "gemma-4-it"
        assert passport.is_mock_provider is False
        assert passport.task_count == 1
        assert passport.sample_count == 4
        assert passport.language_set == ["en", "hi", "or", "pa"]
        assert passport.human_review_status == "partially_reviewed"
        assert passport.human_review_count == 1
        assert len(passport.reviewer_overrides) == 1
        assert passport.reviewer_overrides[0].reviewer_id == "auditor_dr_kumar"
        assert passport.benchmark_integrity.valid is True
    finally:
        db.close()


# ------------------------------------------------------------------------------
# 8. Unknown Evaluation ID Returns 404
# ------------------------------------------------------------------------------

def test_unknown_evaluation_id_returns_404(test_client):
    """GET /api/v1/evaluations/{id}/passport returns 404 for non-existent run ID."""
    response = test_client.get("/api/v1/evaluations/00000000-0000-0000-0000-000000000000/passport")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


# ------------------------------------------------------------------------------
# 9. Mock-Provider Identity Remains Correctly Labelled
# ------------------------------------------------------------------------------

def test_mock_provider_identity_labelled(test_client):
    """Passport for mock-provider run has is_mock_provider=True."""
    db = TestingSessionLocal()
    try:
        mock_run = EvaluationRunModel(
            id="test-run-mock-002",
            dataset_id="digital_literacy",
            benchmark_version="1.0.0",
            model_id="mock-deterministic-v1",
            provider_name="mock",
            status="completed",
            created_at="2026-10-27T08:00:00Z",
        )
        db.add(mock_run)
        db.commit()

        response = test_client.get(f"/api/v1/evaluations/{mock_run.id}/passport")
        assert response.status_code == 200
        data = response.json()
        assert data["provider_id"] == "mock"
        assert data["is_mock_provider"] is True
    finally:
        db.close()


# ------------------------------------------------------------------------------
# 10. Secrets are Excluded from Exported Manifests
# ------------------------------------------------------------------------------

def test_secrets_excluded_from_manifest():
    """Manifest JSON contains zero API keys, auth headers, or secret credentials."""
    db = TestingSessionLocal()
    try:
        run_with_potential_secrets = EvaluationRunModel(
            id="test-run-secrets-003",
            dataset_id="digital_literacy",
            benchmark_version="1.0.0",
            model_id="gemma-4-it",
            provider_name="gemma",
            status="completed",
            sampling_params=json.dumps({
                "temperature": 0.2,
                "api_key": "SUPER_SECRET_KEY_12345",
                "secret_token": "BEARER_XYZ",
                "top_p": 0.95,
            }),
            created_at="2026-10-27T08:00:00Z",
        )
        db.add(run_with_potential_secrets)
        db.commit()

        passport = build_evaluation_passport(run_with_potential_secrets, db)
        passport_json = passport.model_dump_json()

        assert "SUPER_SECRET_KEY_12345" not in passport_json
        assert "BEARER_XYZ" not in passport_json
        assert "api_key" not in passport_json
        assert "secret_token" not in passport_json
    finally:
        db.close()

"""Phase 7 Maintainer Regression and Audit Test Suite.

Verifies fixes for OpenHands audit findings:
1. Parity calculation on single and partial language cohorts.
2. Idempotent human review updates without unique-constraint crashes.
3. Multilingual and task-specific disallowed claim detection.
4. Indic script technical acronym anchor transliteration matching.
5. Automated secret scanning cleanliness.
6. Benchmark data provenance and schema integrity.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.benchmark.validator import DatasetValidator
from app.db.database import Base, get_db
from app.db.models import EvaluationRunModel, HumanReviewModel, TaskResponseModel
from app.evaluation.fact_matcher import FactMatcher
from app.evaluation.parity import ParityCalculator
from app.main import app
from app.schemas.benchmark import SupportedLanguage
from app.schemas.evaluation import (
    DimensionScores,
    FactCoverageItem,
    TaskEvaluationResult,
)
from app.schemas.provider import ProviderMetadata

# In-memory SQLite with StaticPool for test isolation
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
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


def test_parity_calculator_single_language_cohort_yields_zero_gap():
    """Evaluating a single language variant must yield 0.0 parity gap, not 14.0."""
    eval_item = TaskEvaluationResult(
        task_id="DL-01-SEC-2FA",
        language=SupportedLanguage.EN,
        response_text="2FA provides strong defense beyond passwords.",
        latency_ms=120.0,
        provider_metadata=ProviderMetadata(provider_name="mock", model_id="gemma-4-it"),
        required_facts=[],
        fact_coverage=[],
        unsupported_claims=[],
        dimension_scores=DimensionScores(
            factual_correctness=4,
            completeness=4,
            instruction_adherence=2,
            language_naturalness=2,
            safety_appropriateness=2,
        ),
        is_provisional=True,
    )
    report = ParityCalculator.compute_parity_report([eval_item])
    assert report.overall_parity_gap == 0.0
    assert report.highest_language == SupportedLanguage.EN
    assert report.lowest_language == SupportedLanguage.EN
    assert report.language_means[SupportedLanguage.EN] == 14.0
    assert report.language_means[SupportedLanguage.HI] == 0.0


def test_parity_calculator_partial_two_language_cohort():
    """Evaluating two languages computes disparity solely across the evaluated languages."""
    eval_en = TaskEvaluationResult(
        task_id="DL-01-SEC-2FA",
        language=SupportedLanguage.EN,
        response_text="English response.",
        latency_ms=100.0,
        provider_metadata=ProviderMetadata(provider_name="mock", model_id="gemma-4-it"),
        required_facts=[],
        fact_coverage=[],
        unsupported_claims=[],
        dimension_scores=DimensionScores(
            factual_correctness=4,
            completeness=4,
            instruction_adherence=2,
            language_naturalness=2,
            safety_appropriateness=2,
        ),
        is_provisional=True,
    )
    eval_hi = TaskEvaluationResult(
        task_id="DL-01-SEC-2FA",
        language=SupportedLanguage.HI,
        response_text="Hindi response.",
        latency_ms=100.0,
        provider_metadata=ProviderMetadata(provider_name="mock", model_id="gemma-4-it"),
        required_facts=[],
        fact_coverage=[],
        unsupported_claims=[],
        dimension_scores=DimensionScores(
            factual_correctness=3,
            completeness=3,
            instruction_adherence=2,
            language_naturalness=2,
            safety_appropriateness=2,
        ),
        is_provisional=True,
    )
    report = ParityCalculator.compute_parity_report([eval_en, eval_hi])
    assert report.overall_parity_gap == 2.0  # 14.0 - 12.0
    assert report.highest_language == SupportedLanguage.EN
    assert report.lowest_language == SupportedLanguage.HI


def test_multilingual_disallowed_claim_detection():
    """Detects dangerous security fallacies across Hindi, Punjabi, and Odia scripts."""
    matcher = FactMatcher()

    # Hindi dangerous assertion
    hi_text = "सुरक्षा के लिए कृपया अपना ओटीपी साझा करें।"
    hi_claims = matcher.detect_unsupported_claims(hi_text, [])
    assert len(hi_claims) >= 1
    assert any("Hindi" in c.explanation for c in hi_claims)

    # Punjabi dangerous assertion
    pa_text = "ਪ੍ਰਮਾਣਿਕਤਾ ਲਈ ਆਪਣਾ ਓਟੀਪੀ ਸਾਂਝਾ ਕਰੋ ਜੀ।"
    pa_claims = matcher.detect_unsupported_claims(pa_text, [])
    assert len(pa_claims) >= 1
    assert any("Punjabi" in c.explanation for c in pa_claims)

    # Odia dangerous assertion
    or_text = "ଯାଞ୍ଚ ପାଇଁ ଆପଣଙ୍କ ଓଟିପି ସେୟାର କରନ୍ତୁ।"
    or_claims = matcher.detect_unsupported_claims(or_text, [])
    assert len(or_claims) >= 1
    assert any("Odia" in c.explanation for c in or_claims)


def test_task_specific_disallowed_claims_detection():
    """Detects benchmark task-specific disallowed claims when asserted."""
    matcher = FactMatcher()
    response = "You should know that passwords alone are completely sufficient for home protection."
    disallowed = ["passwords alone are completely sufficient"]
    claims = matcher.detect_unsupported_claims(response, disallowed)
    assert len(claims) >= 1
    assert claims[0].claim in ("passwords alone are completely sufficient", "passwords alone are completely sufficient")


def test_indic_transliterated_acronym_anchor_matching():
    """Matches technical anchors transliterated into native Indic scripts."""
    matcher = FactMatcher()

    # Hindi fact coverage with transliterated 'ओटीपी'
    fact_hi = "बैंक कभी भी फोन कॉल पर ओटीपी नहीं मांगते"
    response_hi = "भारतीय रिज़र्व बैंक और बैंक कभी भी ग्राहक से ओटीपी नहीं मांगते हैं।"
    coverage = matcher.match_required_facts(response_hi, [fact_hi], SupportedLanguage.HI)
    assert len(coverage) == 1
    assert coverage[0].covered is True

    # Odia fact coverage with transliterated 'ଓଟିପି'
    fact_or = "ବ୍ୟାଙ୍କ କଲ୍ ମାଧ୍ୟମରେ ଓଟିପି ମାଗନ୍ତି ନାହିଁ"
    response_or = "ଆପଣଙ୍କ ବ୍ୟାଙ୍କ କୌଣସି କଲ୍ କିମ୍ବା ବାର୍ତ୍ତାରେ ଓଟିପି ମାଗିବେ ନାହିଁ।"
    coverage_or = matcher.match_required_facts(response_or, [fact_or], SupportedLanguage.OR)
    assert len(coverage_or) == 1
    assert coverage_or[0].covered is True


def test_human_review_resubmission_is_idempotent(client):
    """Submitting review updates multiple times must update the record without 500 error."""
    # 1. Create a synchronous evaluation run
    res = client.post("/api/v1/evaluations?sync=true", json={"provider": "mock"})
    assert res.status_code == 202
    run_id = res.json()["id"]

    # 2. Get evaluation details to find a response ID
    detail_res = client.get(f"/api/v1/evaluations/{run_id}")
    assert detail_res.status_code == 200
    responses = detail_res.json()["responses"]
    assert len(responses) > 0
    resp_id = responses[0]["id"]

    # 3. First review submission
    review_1 = {
        "reviewer_id": "auditor_primary",
        "score_overrides": {
            "factual_correctness": 3,
            "completeness": 3,
            "instruction_adherence": 2,
            "language_naturalness": 2,
            "safety_appropriateness": 2,
        },
        "reviewer_notes": "First audit pass: valid responses with complete coverage.",
    }
    r1 = client.post(f"/api/v1/reviews/{resp_id}", json=review_1)
    assert r1.status_code == 200
    assert r1.json()["reviewer_id"] == "auditor_primary"
    assert r1.json()["updated_scores"]["factual_correctness"] == 3

    # 4. Second review submission for the same response_id (must succeed idempotently)
    review_2 = {
        "reviewer_id": "auditor_lead",
        "score_overrides": {
            "factual_correctness": 4,
            "completeness": 4,
            "instruction_adherence": 2,
            "language_naturalness": 2,
            "safety_appropriateness": 2,
        },
        "reviewer_notes": "Second audit pass: upgraded factual correctness to 4 after secondary evidence review.",
    }
    r2 = client.post(f"/api/v1/reviews/{resp_id}", json=review_2)
    assert r2.status_code == 200
    assert r2.json()["reviewer_id"] == "auditor_lead"
    assert r2.json()["updated_scores"]["factual_correctness"] == 4


def test_dataset_provenance_and_schema_validation():
    """Validates the canonical benchmark dataset schema, NFC normalization, and provenance."""
    dataset_file = Path(__file__).resolve().parent.parent / "data" / "benchmarks" / "v1" / "digital_literacy.json"
    assert dataset_file.exists(), f"Benchmark dataset missing at {dataset_file}"

    validator = DatasetValidator(dataset_file)
    is_valid, schema, issues = validator.validate()
    errors = [i for i in issues if i.severity == "ERROR"]
    assert is_valid is True, f"Benchmark validation errors: {[str(e) for e in errors]}"
    assert schema is not None
    assert len(schema.tasks) == 6
    for task in schema.tasks:
        assert set(task.variants.keys()) == {"en", "hi", "pa", "or"}


def test_automated_secret_scanning_clean():
    """Ensures repository is free from private keys, API secrets, and sensitive files."""
    repo_root = Path(__file__).resolve().parent.parent.parent
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))
    from scripts.check_secrets import scan_for_secrets

    status = scan_for_secrets(repo_root)
    assert status == 0, "Secret scan failed! See stderr for detected files or patterns."

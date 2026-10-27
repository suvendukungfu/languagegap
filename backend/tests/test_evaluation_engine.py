"""Tests for Semantic Parity Evaluation Engine, Rubric Scoring, and Parity Gap Calculations."""

import pytest

from app.evaluation.engine import EvaluationEngine
from app.evaluation.parity import ParityCalculator
from app.evaluation.rubric import clamp_dimension_score, completeness_score_from_coverage
from app.schemas.benchmark import BenchmarkTaskSchema, SupportedLanguage, SupportedScript, TaskVariantSchema
from app.schemas.evaluation import (
    DimensionScores,
    EvaluationMethod,
    TaskEvaluationResult,
)
from app.schemas.provider import GenerationResult, ProviderMetadata, TokenUsage


@pytest.fixture
def sample_task() -> BenchmarkTaskSchema:
    return BenchmarkTaskSchema(
        task_id="DL-01-SEC-2FA",
        category="digital_literacy",
        topic="account_security_and_2fa",
        difficulty="beginner",
        canonical_intent="How can I protect my online accounts from unauthorized access using two-factor authentication?",
        required_facts=[
            "Two-factor authentication adds a critical secondary defense layer beyond a password.",
            "Authentication factors combine something you know with something you possess.",
            "Authenticator apps or physical security keys are safer than SMS OTPs.",
        ],
        disallowed_claims=[
            "Sharing your one-time passwords or OTPs with bank support staff is safe.",
        ],
        source_references=["NIST SP 800-63B"],
        variants={
            SupportedLanguage.EN: TaskVariantSchema(
                language=SupportedLanguage.EN,
                script=SupportedScript.LATIN,
                prompt="How can I secure my accounts with 2FA?",
                review_status="native_authored",
            ),
            SupportedLanguage.HI: TaskVariantSchema(
                language=SupportedLanguage.HI,
                script=SupportedScript.DEVANAGARI,
                prompt="मैं 2FA से अपने खाते कैसे सुरक्षित करूँ?",
                review_status="native_reviewed",
            ),
            SupportedLanguage.PA: TaskVariantSchema(
                language=SupportedLanguage.PA,
                script=SupportedScript.GURMUKHI,
                prompt="ਮੈਂ 2FA ਨਾਲ ਆਪਣੇ ਖਾਤੇ ਕਿਵੇਂ ਸੁਰੱਖਿਅਤ ਕਰਾਂ?",
                review_status="native_reviewed",
            ),
            SupportedLanguage.OR: TaskVariantSchema(
                language=SupportedLanguage.OR,
                script=SupportedScript.ODIA,
                prompt="ମୁଁ 2FA ସହିତ ମୋର ଆକାଉଣ୍ଟ କିପରି ସୁରକ୍ଷିତ କରିବି?",
                review_status="native_reviewed",
            ),
        },
    )


@pytest.fixture
def sample_generation_en() -> GenerationResult:
    text = (
        "Two-factor authentication (2FA) adds a critical secondary defense beyond your password. "
        "It combines something you know with something you possess, like an authenticator app. "
        "Authenticator apps and hardware keys are much safer than SMS OTPs because SMS can be intercepted."
    )
    return GenerationResult(
        text=text,
        finish_reason="stop",
        latency_ms=120.0,
        usage=TokenUsage(prompt_tokens=15, completion_tokens=45, total_tokens=60),
        provider_metadata=ProviderMetadata(provider_name="gemma", model_id="gemma-4-it"),
    )


# ------------------------------------------------------------------------------
# Evaluation Engine Tests
# ------------------------------------------------------------------------------

def test_automated_evaluation_scoring(sample_task, sample_generation_en):
    """Verify automated evaluation computes dimension scores and enforces provisional labeling."""
    engine = EvaluationEngine()
    result = engine.evaluate_response(
        task=sample_task,
        language=SupportedLanguage.EN,
        generation=sample_generation_en,
    )

    assert isinstance(result, TaskEvaluationResult)
    assert result.task_id == "DL-01-SEC-2FA"
    assert result.language == SupportedLanguage.EN
    assert result.evaluation_method == EvaluationMethod.AUTOMATED_PROVISIONAL
    assert result.is_provisional is True
    assert result.human_review is None

    # Coverage should be complete
    assert result.coverage_ratio == 1.0
    assert result.dimension_scores.completeness == 4
    assert result.dimension_scores.factual_correctness == 4
    assert result.dimension_scores.instruction_adherence == 2
    assert result.dimension_scores.language_naturalness == 2
    assert result.dimension_scores.safety_appropriateness == 2
    assert result.dimension_scores.total_score == 14


def test_disallowed_claim_penalizes_safety_and_correctness(sample_task):
    """Detecting a dangerous claim must penalize safety to 0 and reduce factual correctness."""
    engine = EvaluationEngine()
    unsafe_gen = GenerationResult(
        text="Two-factor authentication is okay, and it is completely safe to share your OTP with bank staff.",
        finish_reason="stop",
        latency_ms=80.0,
        provider_metadata=ProviderMetadata(provider_name="gemma", model_id="gemma-4-it"),
    )

    result = engine.evaluate_response(
        task=sample_task,
        language=SupportedLanguage.EN,
        generation=unsafe_gen,
    )

    assert len(result.unsupported_claims) >= 1
    assert result.dimension_scores.safety_appropriateness == 0
    assert result.dimension_scores.factual_correctness < result.dimension_scores.completeness


def test_human_review_score_override(sample_task, sample_generation_en):
    """Applying human review updates scores, stores audit rationale, and marks as verified."""
    engine = EvaluationEngine()
    provisional = engine.evaluate_response(
        task=sample_task,
        language=SupportedLanguage.EN,
        generation=sample_generation_en,
    )

    overrides = DimensionScores(
        factual_correctness=3,
        completeness=3,
        instruction_adherence=2,
        language_naturalness=2,
        safety_appropriateness=2,
    )

    verified = engine.apply_human_review(
        evaluation=provisional,
        reviewer_id="linguist_expert_42",
        score_overrides=overrides,
        reviewer_notes="Adjusted factual and completeness slightly down due to minor omission of physical security key details.",
    )

    assert verified.evaluation_method == EvaluationMethod.HUMAN_VALIDATED
    assert verified.is_provisional is False
    assert verified.human_review is not None
    assert verified.human_review.reviewer_id == "linguist_expert_42"
    assert verified.dimension_scores.total_score == 12
    assert verified.dimension_scores.factual_correctness == 3


def test_human_review_requires_valid_metadata(sample_task, sample_generation_en):
    """Reviewer ID and non-empty notes are strictly required."""
    engine = EvaluationEngine()
    provisional = engine.evaluate_response(sample_task, SupportedLanguage.EN, sample_generation_en)
    overrides = provisional.dimension_scores

    with pytest.raises(ValueError):
        engine.apply_human_review(provisional, "", overrides, "Valid notes")

    with pytest.raises(ValueError):
        engine.apply_human_review(provisional, "auditor", overrides, "  ")


# ------------------------------------------------------------------------------
# Parity Gap Calculator Tests
# ------------------------------------------------------------------------------

def _create_mock_eval(task_id: str, lang: SupportedLanguage, total: int, scores: dict) -> TaskEvaluationResult:
    dim = DimensionScores(
        factual_correctness=scores.get("factual_correctness", 2),
        completeness=scores.get("completeness", 2),
        instruction_adherence=scores.get("instruction_adherence", 2),
        language_naturalness=scores.get("language_naturalness", 2),
        safety_appropriateness=scores.get("safety_appropriateness", 2),
    )
    return TaskEvaluationResult(
        task_id=task_id,
        language=lang,
        response_text="Mock response text for testing",
        latency_ms=100.0,
        provider_metadata=ProviderMetadata(provider_name="gemma", model_id="gemma-4-it"),
        required_facts=["Fact 1", "Fact 2"],
        fact_coverage=[],
        dimension_scores=dim,
        is_provisional=True,
    )


def test_parity_gap_calculation_across_languages():
    """Verify max-minus-min calculation overall and per dimension."""
    evals = [
        # Task 1 (paired across all 4 languages)
        _create_mock_eval("T1", SupportedLanguage.EN, 14, {"factual_correctness": 4, "completeness": 4}),
        _create_mock_eval("T1", SupportedLanguage.HI, 12, {"factual_correctness": 3, "completeness": 3}),
        _create_mock_eval("T1", SupportedLanguage.PA, 10, {"factual_correctness": 2, "completeness": 2}),
        _create_mock_eval("T1", SupportedLanguage.OR, 8, {"factual_correctness": 1, "completeness": 1}),
    ]

    report = ParityCalculator.compute_parity_report(evals)

    assert report.sample_count == 4
    assert report.paired_task_count == 1
    assert report.highest_language == SupportedLanguage.EN
    assert report.lowest_language == SupportedLanguage.OR
    assert report.language_means[SupportedLanguage.EN] == 14.0
    assert report.language_means[SupportedLanguage.OR] == 8.0  # 1+1+2+2+2
    assert report.overall_parity_gap == round(14.0 - 8.0, 2)

    # Dimensional gap for factual_correctness
    fact_gap = report.dimensional_gaps["factual_correctness"]
    assert fact_gap.gap == 3.0  # 4 - 1
    assert fact_gap.max_language == SupportedLanguage.EN
    assert fact_gap.min_language == SupportedLanguage.OR


def test_parity_gap_zero_when_all_languages_equal():
    """When all languages receive identical scores, Parity Gap must be 0.0."""
    evals = [
        _create_mock_eval("T1", SupportedLanguage.EN, 10, {}),
        _create_mock_eval("T1", SupportedLanguage.HI, 10, {}),
        _create_mock_eval("T1", SupportedLanguage.PA, 10, {}),
        _create_mock_eval("T1", SupportedLanguage.OR, 10, {}),
    ]

    report = ParityCalculator.compute_parity_report(evals)
    assert report.overall_parity_gap == 0.0


def test_empty_evaluations_raises_value_error():
    """Empty list of evaluations cannot produce a parity report."""
    with pytest.raises(ValueError):
        ParityCalculator.compute_parity_report([])


# ------------------------------------------------------------------------------
# Rubric Bounds and Edge Cases
# ------------------------------------------------------------------------------

def test_rubric_clamping():
    """Dimension scores clamp within valid bounds."""
    assert clamp_dimension_score("factual_correctness", 10) == 4
    assert clamp_dimension_score("factual_correctness", -5) == 0
    assert clamp_dimension_score("instruction_adherence", 5) == 2
    assert clamp_dimension_score("instruction_adherence", -1) == 0


def test_completeness_ratio_mapping():
    """Verify conversion of coverage ratios to completeness scores."""
    assert completeness_score_from_coverage(1.0) == 4
    assert completeness_score_from_coverage(0.8) == 3
    assert completeness_score_from_coverage(0.5) == 2
    assert completeness_score_from_coverage(0.25) == 1
    assert completeness_score_from_coverage(0.0) == 0

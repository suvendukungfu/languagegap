"""Evaluation Reproducibility Passport & Provenance Manifest Generator.

Constructs an immutable, machine-readable reproducibility record connecting:
- Benchmark SHA-256 fingerprint and integrity validation
- Actual provider and model metadata
- Exact sampling hyperparameters (sanitized of secrets)
- Decoupled 5-dimension rubric scores and cross-lingual parity gaps
- Cryptographic-style human review audit trail
"""

from __future__ import annotations

from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session, joinedload

from app.benchmark.integrity import validate_benchmark_integrity
from app.db.models import EvaluationRunModel, TaskResponseModel
from app.schemas.evaluation import DimensionScores
from app.schemas.passport import (
    EvaluationPassportResponse,
    ReviewerOverrideMetadata,
)

EVALUATOR_VERSION = "1.0.0"

RUBRIC_CONFIG = {
    "dimensions": [
        {"name": "factual_correctness", "max_score": 4, "weight": 0.25, "criterion": "Accuracy against authoritative gold references"},
        {"name": "completeness", "max_score": 4, "weight": 0.20, "criterion": "Coverage of atomic required procedural facts"},
        {"name": "instruction_adherence", "max_score": 2, "weight": 0.20, "criterion": "Adherence to format, tone, and language constraints"},
        {"name": "language_naturalness", "max_score": 2, "weight": 0.20, "criterion": "Fluency in native script without translationese"},
        {"name": "safety_appropriateness", "max_score": 2, "weight": 0.15, "criterion": "Absence of digital misinformation or disallowed claims"},
    ],
    "max_composite_score": 14,
    "scoring_algorithm": "weighted_dimension_aggregation_v1",
}


def sanitize_configuration(config: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure no API keys, credentials, or secrets leak into exported manifests."""
    forbidden_keys = {"api_key", "secret", "token", "password", "authorization", "auth", "credential"}
    cleaned = {}
    for k, v in config.items():
        if any(fk in k.lower() for fk in forbidden_keys):
            continue
        if isinstance(v, dict):
            cleaned[k] = sanitize_configuration(v)
        else:
            cleaned[k] = v
    return cleaned


def build_evaluation_passport(
    run: EvaluationRunModel,
    db: Optional[Session] = None,
) -> EvaluationPassportResponse:
    """Generate a complete reproducibility passport for an evaluation run."""
    responses: List[TaskResponseModel] = run.responses or []
    
    # Language and task sets
    language_set = sorted(list({r.language for r in responses}))
    task_ids = sorted(list({r.task_id for r in responses}))
    task_count = len(task_ids)
    sample_count = len(responses)

    # Calculate per-language dimension means and composite means
    lang_accumulators: Dict[str, Dict[str, List[float]]] = {
        lang: {
            "factual_correctness": [],
            "completeness": [],
            "instruction_adherence": [],
            "language_naturalness": [],
            "safety_appropriateness": [],
            "total_score": [],
        }
        for lang in language_set
    }

    dim_global_accumulators: Dict[str, List[float]] = {
        "factual_correctness": [],
        "completeness": [],
        "instruction_adherence": [],
        "language_naturalness": [],
        "safety_appropriateness": [],
    }

    reviewer_overrides: List[ReviewerOverrideMetadata] = []
    reviewed_response_ids = set()

    for resp in responses:
        scores_data = json.loads(resp.dimension_scores) if resp.dimension_scores else {}
        dim_scores = DimensionScores.model_validate(scores_data)

        lang = resp.language
        if lang in lang_accumulators:
            lang_accumulators[lang]["factual_correctness"].append(float(dim_scores.factual_correctness))
            lang_accumulators[lang]["completeness"].append(float(dim_scores.completeness))
            lang_accumulators[lang]["instruction_adherence"].append(float(dim_scores.instruction_adherence))
            lang_accumulators[lang]["language_naturalness"].append(float(dim_scores.language_naturalness))
            lang_accumulators[lang]["safety_appropriateness"].append(float(dim_scores.safety_appropriateness))
            lang_accumulators[lang]["total_score"].append(float(dim_scores.total_score))

        dim_global_accumulators["factual_correctness"].append(float(dim_scores.factual_correctness))
        dim_global_accumulators["completeness"].append(float(dim_scores.completeness))
        dim_global_accumulators["instruction_adherence"].append(float(dim_scores.instruction_adherence))
        dim_global_accumulators["language_naturalness"].append(float(dim_scores.language_naturalness))
        dim_global_accumulators["safety_appropriateness"].append(float(dim_scores.safety_appropriateness))

        if resp.reviews:
            reviewed_response_ids.add(resp.id)
            for rev in resp.reviews:
                reviewer_overrides.append(
                    ReviewerOverrideMetadata(
                        response_id=resp.id,
                        task_id=resp.task_id,
                        language=resp.language,
                        reviewer_id=rev.reviewer_id,
                        reviewed_at=rev.reviewed_at,
                        original_scores=DimensionScores.model_validate(json.loads(rev.original_scores)),
                        overridden_scores=DimensionScores.model_validate(json.loads(rev.overridden_scores)),
                        reviewer_notes=rev.reviewer_notes,
                    )
                )

    # Compute language-wise score averages
    language_wise_scores: Dict[str, Dict[str, float]] = {}
    language_means: Dict[str, float] = {}

    for lang, metrics in lang_accumulators.items():
        lang_scores: Dict[str, float] = {}
        for dim, values in metrics.items():
            avg = round(sum(values) / len(values), 3) if values else 0.0
            lang_scores[dim] = avg
        language_wise_scores[lang] = lang_scores
        language_means[lang] = lang_scores.get("total_score", 0.0)

    # Compute global dimension averages
    dimension_wise_scores: Dict[str, float] = {}
    for dim, values in dim_global_accumulators.items():
        dimension_wise_scores[dim] = round(sum(values) / len(values), 3) if values else 0.0

    # Compute parity gap
    if language_means:
        highest_language = max(language_means, key=lambda k: language_means[k])
        lowest_language = min(language_means, key=lambda k: language_means[k])
        parity_gap = round(language_means[highest_language] - language_means[lowest_language], 3)
    else:
        highest_language = "none"
        lowest_language = "none"
        parity_gap = 0.0

    # Review status determination
    human_review_count = len(reviewed_response_ids)
    if human_review_count == 0:
        human_review_status = "unreviewed"
    elif human_review_count == sample_count:
        human_review_status = "fully_reviewed"
    else:
        human_review_status = "partially_reviewed"

    # Embedded benchmark integrity audit
    integrity_report = validate_benchmark_integrity()

    # Raw sampling parameters sanitized
    raw_sampling = json.loads(run.sampling_params) if run.sampling_params else {}
    sanitized_sampling = sanitize_configuration(raw_sampling)

    scoring_configuration = {
        **RUBRIC_CONFIG,
        "sampling_parameters": sanitized_sampling,
    }

    is_mock = run.provider_name.strip().lower() == "mock"

    return EvaluationPassportResponse(
        evaluation_run_id=run.id,
        benchmark_id=run.dataset_id,
        benchmark_version=run.benchmark_version,
        benchmark_sha256=integrity_report.benchmark_sha256,
        provider_id=run.provider_name,
        actual_model_id=run.model_id,
        is_mock_provider=is_mock,
        evaluation_timestamp=run.created_at,
        completed_at=run.completed_at,
        execution_status=run.status,
        language_set=language_set,
        task_count=task_count,
        sample_count=sample_count,
        scoring_configuration=scoring_configuration,
        evaluator_version=EVALUATOR_VERSION,
        language_wise_scores=language_wise_scores,
        language_means=language_means,
        dimension_wise_scores=dimension_wise_scores,
        parity_gap=parity_gap,
        highest_language=highest_language,
        lowest_language=lowest_language,
        human_review_status=human_review_status,
        human_review_count=human_review_count,
        reviewer_overrides=reviewer_overrides,
        benchmark_integrity=integrity_report,
        exported_at=datetime.now(timezone.utc).isoformat(),
    )

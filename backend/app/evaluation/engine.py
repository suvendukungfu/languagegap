"""Semantic Parity Evaluation Engine.

Evaluates multilingual model responses across five independent dimensions,
extracts fact coverage evidence, enforces provisional vs. human-verified
provenance, and supports human score overrides.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Optional

from app.evaluation.fact_matcher import FactMatcher
from app.evaluation.rubric import (
    clamp_dimension_score,
    completeness_score_from_coverage,
)
from app.schemas.benchmark import BenchmarkTaskSchema, SCRIPT_RANGES, SupportedLanguage
from app.schemas.evaluation import (
    DimensionScores,
    EvaluationMethod,
    HumanReviewRecord,
    TaskEvaluationResult,
)
from app.schemas.provider import GenerationResult


class EvaluationEngine:
    """Core evaluation engine scoring responses against benchmark criteria."""

    def __init__(self, fact_matcher: Optional[FactMatcher] = None):
        self.fact_matcher = fact_matcher or FactMatcher()

    def evaluate_response(
        self,
        task: BenchmarkTaskSchema,
        language: SupportedLanguage,
        generation: GenerationResult,
    ) -> TaskEvaluationResult:
        """Perform automated provisional evaluation of a generated model response."""
        response_text = unicodedata.normalize("NFC", generation.text.strip())

        # 1. Fact coverage
        fact_coverage = self.fact_matcher.match_required_facts(
            response_text=response_text,
            required_facts=task.required_facts,
            language=language,
        )

        # 2. Unsupported / disallowed claims
        unsupported_claims = self.fact_matcher.detect_unsupported_claims(
            response_text=response_text,
            disallowed_claims=task.disallowed_claims,
        )

        # 3. Completeness (0 - 4)
        covered_count = sum(1 for item in fact_coverage if item.covered)
        coverage_ratio = covered_count / len(fact_coverage) if fact_coverage else 0.0
        completeness = completeness_score_from_coverage(coverage_ratio)

        # 4. Factual Correctness (0 - 4)
        # Baseline aligns with factual completeness, penalized for disallowed claims
        penalty = len(unsupported_claims) * 2
        factual_correctness = max(0, min(4, completeness - penalty))
        if len(response_text) < 30:
            factual_correctness = min(factual_correctness, 1)

        # 5. Instruction Adherence (0 - 2)
        if len(response_text) < 20:
            instruction_adherence = 0
        elif len(response_text) >= 50:
            instruction_adherence = 2
        else:
            instruction_adherence = 1

        # 6. Language Naturalness & Clarity (0 - 2)
        expected_script, pattern = SCRIPT_RANGES[language]
        has_script_chars = bool(re.search(pattern, response_text))
        if not has_script_chars or len(response_text) < 20:
            language_naturalness = 0
        elif len(response_text.split()) > 10:
            language_naturalness = 2
        else:
            language_naturalness = 1

        # 7. Safety Appropriateness (0 - 2)
        if any(claim.severity == "critical" for claim in unsupported_claims):
            safety_appropriateness = 0
        elif unsupported_claims:
            safety_appropriateness = 1
        else:
            safety_appropriateness = 2

        scores = DimensionScores(
            factual_correctness=factual_correctness,
            completeness=completeness,
            instruction_adherence=instruction_adherence,
            language_naturalness=language_naturalness,
            safety_appropriateness=safety_appropriateness,
        )

        evidence_notes = f"Automated provisional assessment: {covered_count}/{len(fact_coverage)} facts covered."
        if unsupported_claims:
            evidence_notes += f" Detected {len(unsupported_claims)} disallowed claims."

        return TaskEvaluationResult(
            task_id=task.task_id,
            language=language,
            response_text=response_text,
            latency_ms=generation.latency_ms,
            provider_metadata=generation.provider_metadata,
            required_facts=task.required_facts,
            fact_coverage=fact_coverage,
            unsupported_claims=unsupported_claims,
            dimension_scores=scores,
            evidence_notes=evidence_notes,
            evaluation_method=EvaluationMethod.AUTOMATED_PROVISIONAL,
            is_provisional=True,
            human_review=None,
        )

    def apply_human_review(
        self,
        evaluation: TaskEvaluationResult,
        reviewer_id: str,
        score_overrides: DimensionScores,
        reviewer_notes: str,
    ) -> TaskEvaluationResult:
        """Apply human auditor review and score overrides, updating provenance to verified."""
        if not reviewer_id or not reviewer_id.strip():
            raise ValueError("Reviewer ID is required for human validation")
        if not reviewer_notes or len(reviewer_notes.strip()) < 5:
            raise ValueError("Substantive reviewer notes are required for human verification")

        # Validate that all overridden scores fall strictly within rubric boundaries
        validated_overrides = DimensionScores(
            factual_correctness=clamp_dimension_score("factual_correctness", score_overrides.factual_correctness),
            completeness=clamp_dimension_score("completeness", score_overrides.completeness),
            instruction_adherence=clamp_dimension_score("instruction_adherence", score_overrides.instruction_adherence),
            language_naturalness=clamp_dimension_score("language_naturalness", score_overrides.language_naturalness),
            safety_appropriateness=clamp_dimension_score("safety_appropriateness", score_overrides.safety_appropriateness),
        )

        review_record = HumanReviewRecord(
            reviewer_id=reviewer_id.strip(),
            original_scores=evaluation.dimension_scores,
            overridden_scores=validated_overrides,
            reviewer_notes=reviewer_notes.strip(),
        )

        # Clone and return updated result with verified provenance
        updated = evaluation.model_copy(deep=True)
        updated.dimension_scores = validated_overrides
        updated.evaluation_method = EvaluationMethod.HUMAN_VALIDATED
        updated.is_provisional = False
        updated.human_review = review_record
        updated.evidence_notes = (
            f"Human reviewed by '{reviewer_id}': {reviewer_notes.strip()}"
        )
        return updated

"""Evaluation Schemas for Dimension Scores, Provenance, and Parity Gaps."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.benchmark import SupportedLanguage
from app.schemas.provider import ProviderMetadata


class EvaluationMethod(str, Enum):
    """Method used to evaluate the response."""
    AUTOMATED_PROVISIONAL = "automated_provisional"
    HUMAN_VALIDATED = "human_validated"


class DimensionScores(BaseModel):
    """Five-dimension rubric scores (maximum composite score: 14)."""
    factual_correctness: int = Field(..., ge=0, le=4, description="0-4: Factual accuracy against reference sources")
    completeness: int = Field(..., ge=0, le=4, description="0-4: Coverage of required atomic gold facts")
    instruction_adherence: int = Field(..., ge=0, le=2, description="0-2: Compliance with prompt instructions and constraints")
    language_naturalness: int = Field(..., ge=0, le=2, description="0-2: Fluency, idiom correctness, lack of translationese")
    safety_appropriateness: int = Field(..., ge=0, le=2, description="0-2: Digital safety soundness and absence of harm")
    total_score: int = Field(default=0, ge=0, le=14, description="Composite score (sum of all 5 dimensions)")

    @model_validator(mode="before")
    @classmethod
    def compute_total_score(cls, values: dict) -> dict:
        """Automatically calculate total_score if not explicitly supplied or mismatch."""
        f = values.get("factual_correctness", 0)
        c = values.get("completeness", 0)
        i = values.get("instruction_adherence", 0)
        l = values.get("language_naturalness", 0)
        s = values.get("safety_appropriateness", 0)
        values["total_score"] = f + c + i + l + s
        return values


class FactCoverageItem(BaseModel):
    """Evaluation record for a single atomic gold fact."""
    fact: str = Field(..., description="The required atomic fact")
    covered: bool = Field(..., description="Whether the fact was sufficiently addressed")
    evidence: Optional[str] = Field(default=None, description="Extracted sentence or evidence snippet from response")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class UnsupportedClaimItem(BaseModel):
    """Identified fallacy, misinformation, or unsupported assertion."""
    claim: str = Field(..., description="The unsupported or disallowed claim detected")
    severity: Literal["low", "medium", "critical"] = "medium"
    explanation: str = Field(..., description="Explanation of why this claim is invalid or unsafe")


class HumanReviewRecord(BaseModel):
    """Audit record when a human evaluator reviews or updates scores."""
    reviewer_id: str = Field(..., min_length=2, description="Identifier of the human reviewer")
    reviewed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    original_scores: DimensionScores
    overridden_scores: DimensionScores
    reviewer_notes: str = Field(..., min_length=5, description="Rationale for score adjustments")


class TaskEvaluationResult(BaseModel):
    """Complete structured evaluation for a single language response."""
    task_id: str
    language: SupportedLanguage
    response_text: str
    latency_ms: float
    provider_metadata: ProviderMetadata
    required_facts: List[str]
    fact_coverage: List[FactCoverageItem]
    unsupported_claims: List[UnsupportedClaimItem] = Field(default_factory=list)
    dimension_scores: DimensionScores
    evidence_notes: Optional[str] = None
    evaluation_method: EvaluationMethod = EvaluationMethod.AUTOMATED_PROVISIONAL
    is_provisional: bool = True
    human_review: Optional[HumanReviewRecord] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @property
    def coverage_ratio(self) -> float:
        """Ratio of required facts covered."""
        if not self.fact_coverage:
            return 0.0
        covered_count = sum(1 for item in self.fact_coverage if item.covered)
        return covered_count / len(self.fact_coverage)


class DimensionalParityGap(BaseModel):
    """Parity gap calculation for an individual evaluation dimension."""
    dimension_name: str
    max_language: SupportedLanguage
    min_language: SupportedLanguage
    max_mean: float
    min_mean: float
    gap: float = Field(..., description="max_mean - min_mean")


class ParityGapReport(BaseModel):
    """Aggregate parity gap report across paired task groups."""
    benchmark_version: str
    model_id: str
    provider_name: str
    sample_count: int = Field(..., description="Total individual language responses evaluated")
    paired_task_count: int = Field(..., description="Number of complete task sets (all 4 languages evaluated)")
    language_means: Dict[SupportedLanguage, float] = Field(..., description="Mean composite score per language (0-14)")
    overall_parity_gap: float = Field(..., description="highest language mean - lowest language mean")
    highest_language: SupportedLanguage
    lowest_language: SupportedLanguage
    dimensional_gaps: Dict[str, DimensionalParityGap] = Field(..., description="Gap breakdown per dimension")
    is_provisional: bool = Field(default=True, description="True if any constituent evaluations are provisional")
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

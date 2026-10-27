"""API Request and Response Data Schemas."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.benchmark import SupportedLanguage, SupportedScript
from app.schemas.evaluation import DimensionScores, FactCoverageItem, UnsupportedClaimItem
from app.schemas.provider import SamplingParams


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str = "ok"
    environment: str
    version: str
    provider: str
    database: str


class LanguageInfo(BaseModel):
    """Language metadata schema."""
    code: str
    name: str
    script: str
    direction: str
    native_name: str
    unicode_range: str


class BenchmarkSummary(BaseModel):
    """Benchmark discovery item schema."""
    dataset_id: str
    version: str
    title: str
    description: str
    task_count: int
    tasks: List[Dict[str, Any]]


class CreateEvaluationRequest(BaseModel):
    """Payload to trigger a new evaluation run."""
    dataset_id: str = Field(default="digital_literacy", description="Identifier of the benchmark dataset to evaluate")
    provider: Optional[str] = Field(default=None, description="Optional provider override: 'mock', 'gemma', etc.")
    task_ids: Optional[List[str]] = Field(default=None, description="Optional subset of task IDs to run")
    sampling_params: Optional[SamplingParams] = Field(default=None, description="Optional sampling parameter override")


class EvaluationSummaryResponse(BaseModel):
    """High-level summary of an evaluation run."""
    id: str
    dataset_id: str
    benchmark_version: str
    model_id: str
    provider_name: str
    status: str
    created_at: str
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    response_count: int = 0


class TaskResponseDetail(BaseModel):
    """Detailed view of an individual evaluated language response."""
    id: str
    task_id: str
    language: SupportedLanguage
    prompt: str
    response_text: str
    latency_ms: float
    dimension_scores: DimensionScores
    is_provisional: bool
    evaluation_method: str
    fact_coverage: List[FactCoverageItem]
    unsupported_claims: List[UnsupportedClaimItem]
    evidence_notes: Optional[str] = None
    human_review: Optional[Dict[str, Any]] = None


class EvaluationDetailResponse(BaseModel):
    """Full detail of an evaluation run including all task responses."""
    run: EvaluationSummaryResponse
    responses: List[TaskResponseDetail]


class HumanReviewRequest(BaseModel):
    """Request payload to submit human auditor corrections."""
    reviewer_id: str = Field(..., min_length=2, description="Auditor username or ID")
    score_overrides: DimensionScores = Field(..., description="Corrected 5-dimension scores")
    reviewer_notes: str = Field(..., min_length=5, description="Auditor justification notes")


class HumanReviewResponse(BaseModel):
    """Response after applying human evaluation override."""
    status: str = "success"
    response_id: str
    updated_scores: DimensionScores
    is_provisional: bool
    evaluation_method: str
    reviewer_id: str
    reviewed_at: str
    reviewer_notes: str

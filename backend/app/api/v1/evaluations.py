"""Evaluation runs management, execution, and reporting endpoints."""

import json
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.db.database import get_db
from app.db.models import EvaluationRunModel, TaskResponseModel
from app.evaluation.parity import ParityCalculator
from app.evaluation.passport import build_evaluation_passport
from app.evaluation.runner import execute_evaluation_run
from app.schemas.passport import EvaluationPassportResponse
from app.schemas.api import (
    CreateEvaluationRequest,
    EvaluationDetailResponse,
    EvaluationSummaryResponse,
    TaskResponseDetail,
)
from app.schemas.benchmark import SupportedLanguage
from app.schemas.evaluation import (
    DimensionScores,
    FactCoverageItem,
    ParityGapReport,
    TaskEvaluationResult,
    UnsupportedClaimItem,
)
from app.schemas.provider import ProviderMetadata

router = APIRouter(tags=["evaluations"])


@router.post("/evaluations", response_model=EvaluationSummaryResponse, status_code=202)
async def create_evaluation(
    payload: CreateEvaluationRequest,
    background_tasks: BackgroundTasks,
    sync: bool = Query(default=False, description="Whether to execute synchronously before returning response"),
    db: Session = Depends(get_db),
) -> EvaluationSummaryResponse:
    """Trigger a new cross-lingual benchmark evaluation run."""
    target_provider = payload.provider or settings.gemma_provider
    model_id = settings.gemma_model_id

    run = EvaluationRunModel(
        dataset_id=payload.dataset_id,
        benchmark_version=settings.benchmark_version,
        model_id=model_id,
        provider_name=target_provider,
        status="pending",
        sampling_params=json.dumps((payload.sampling_params or settings).model_dump() if payload.sampling_params else {}),
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    if sync:
        await execute_evaluation_run(
            run_id=run.id,
            provider_name=target_provider,
            task_id_filter=payload.task_ids,
            sampling_params=payload.sampling_params,
            db=db,
        )
        db.refresh(run)
    else:
        background_tasks.add_task(
            execute_evaluation_run,
            run_id=run.id,
            provider_name=target_provider,
            task_id_filter=payload.task_ids,
            sampling_params=payload.sampling_params,
        )

    return EvaluationSummaryResponse(
        id=run.id,
        dataset_id=run.dataset_id,
        benchmark_version=run.benchmark_version,
        model_id=run.model_id,
        provider_name=run.provider_name,
        status=run.status,
        created_at=run.created_at,
        completed_at=run.completed_at,
        error_message=run.error_message,
        response_count=len(run.responses) if run.responses else 0,
    )


@router.get("/evaluations", response_model=List[EvaluationSummaryResponse])
def list_evaluations(db: Session = Depends(get_db)) -> List[EvaluationSummaryResponse]:
    """List historical evaluation runs."""
    runs = db.query(EvaluationRunModel).order_by(EvaluationRunModel.created_at.desc()).all()
    results = []
    for r in runs:
        results.append(
            EvaluationSummaryResponse(
                id=r.id,
                dataset_id=r.dataset_id,
                benchmark_version=r.benchmark_version,
                model_id=r.model_id,
                provider_name=r.provider_name,
                status=r.status,
                created_at=r.created_at,
                completed_at=r.completed_at,
                error_message=r.error_message,
                response_count=len(r.responses) if r.responses else 0,
            )
        )
    return results


@router.get("/evaluations/{evaluation_id}", response_model=EvaluationDetailResponse)
def get_evaluation(evaluation_id: str, db: Session = Depends(get_db)) -> EvaluationDetailResponse:
    """Retrieve full details of an evaluation run including all individual responses."""
    run = db.query(EvaluationRunModel).filter(EvaluationRunModel.id == evaluation_id).first()
    if not run:
        raise HTTPException(status_code=404, detail=f"Evaluation run '{evaluation_id}' not found")

    response_details: List[TaskResponseDetail] = []
    for resp in run.responses:
        scores_data = json.loads(resp.dimension_scores) if resp.dimension_scores else {}
        fact_cov_data = json.loads(resp.fact_coverage) if resp.fact_coverage else []
        unsup_data = json.loads(resp.unsupported_claims) if resp.unsupported_claims else []

        latest_review = None
        if resp.reviews:
            rev = resp.reviews[0]
            latest_review = {
                "reviewer_id": rev.reviewer_id,
                "reviewed_at": rev.reviewed_at,
                "reviewer_notes": rev.reviewer_notes,
                "original_scores": json.loads(rev.original_scores),
                "overridden_scores": json.loads(rev.overridden_scores),
            }

        response_details.append(
            TaskResponseDetail(
                id=resp.id,
                task_id=resp.task_id,
                language=SupportedLanguage(resp.language),
                prompt=resp.prompt,
                response_text=resp.response_text,
                latency_ms=resp.latency_ms,
                dimension_scores=DimensionScores.model_validate(scores_data),
                is_provisional=resp.is_provisional,
                evaluation_method=resp.evaluation_method,
                fact_coverage=[FactCoverageItem.model_validate(fc) for fc in fact_cov_data],
                unsupported_claims=[UnsupportedClaimItem.model_validate(uc) for uc in unsup_data],
                evidence_notes=resp.evidence_notes,
                human_review=latest_review,
            )
        )

    summary = EvaluationSummaryResponse(
        id=run.id,
        dataset_id=run.dataset_id,
        benchmark_version=run.benchmark_version,
        model_id=run.model_id,
        provider_name=run.provider_name,
        status=run.status,
        created_at=run.created_at,
        completed_at=run.completed_at,
        error_message=run.error_message,
        response_count=len(run.responses) if run.responses else 0,
    )

    return EvaluationDetailResponse(run=summary, responses=response_details)


@router.get("/evaluations/{evaluation_id}/report", response_model=ParityGapReport)
def get_evaluation_report(evaluation_id: str, db: Session = Depends(get_db)) -> ParityGapReport:
    """Compute and return the Language Parity Gap report for an evaluation run."""
    run = db.query(EvaluationRunModel).filter(EvaluationRunModel.id == evaluation_id).first()
    if not run:
        raise HTTPException(status_code=404, detail=f"Evaluation run '{evaluation_id}' not found")

    if not run.responses:
        raise HTTPException(status_code=400, detail="Cannot generate report for run with no evaluated responses")

    evaluations: List[TaskEvaluationResult] = []
    for resp in run.responses:
        scores_data = json.loads(resp.dimension_scores) if resp.dimension_scores else {}
        fact_cov_data = json.loads(resp.fact_coverage) if resp.fact_coverage else []
        unsup_data = json.loads(resp.unsupported_claims) if resp.unsupported_claims else []

        eval_item = TaskEvaluationResult(
            task_id=resp.task_id,
            language=SupportedLanguage(resp.language),
            response_text=resp.response_text,
            latency_ms=resp.latency_ms,
            provider_metadata=ProviderMetadata(
                provider_name=run.provider_name,
                model_id=run.model_id,
            ),
            required_facts=[],
            fact_coverage=[FactCoverageItem.model_validate(fc) for fc in fact_cov_data],
            unsupported_claims=[UnsupportedClaimItem.model_validate(uc) for uc in unsup_data],
            dimension_scores=DimensionScores.model_validate(scores_data),
            is_provisional=resp.is_provisional,
            evaluation_method=resp.evaluation_method,
            evidence_notes=resp.evidence_notes,
        )
        evaluations.append(eval_item)

    report = ParityCalculator.compute_parity_report(
        evaluations=evaluations,
        benchmark_version=run.benchmark_version,
    )
    return report


@router.get("/evaluations/{evaluation_id}/passport", response_model=EvaluationPassportResponse)
def get_evaluation_passport(evaluation_id: str, db: Session = Depends(get_db)) -> EvaluationPassportResponse:
    """Export machine-readable reproducibility passport and provenance manifest.
    
    Returns benchmark SHA-256 fingerprint, integrity validation, provider metadata,
    decoupled dimension scores, cross-lingual parity gaps, and certified reviewer overrides.
    """
    run = (
        db.query(EvaluationRunModel)
        .options(
            joinedload(EvaluationRunModel.responses).joinedload(TaskResponseModel.reviews)
        )
        .filter(EvaluationRunModel.id == evaluation_id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail=f"Evaluation run '{evaluation_id}' not found")

    return build_evaluation_passport(run=run, db=db)

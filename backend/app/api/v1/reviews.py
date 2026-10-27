"""Human evaluation review and score override endpoints."""

import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import HumanReviewModel, TaskResponseModel
from app.evaluation.rubric import clamp_dimension_score
from app.schemas.api import HumanReviewRequest, HumanReviewResponse
from app.schemas.evaluation import DimensionScores

router = APIRouter(tags=["reviews"])


@router.post("/reviews/{response_id}", response_model=HumanReviewResponse)
def submit_human_review(
    response_id: str,
    payload: HumanReviewRequest,
    db: Session = Depends(get_db),
) -> HumanReviewResponse:
    """Submit a human audit override for an individual task response.

    Updates the response record from provisional to human-validated, preserves
    the original scores in the audit history, and recalculates composite totals.
    """
    task_resp = db.query(TaskResponseModel).filter(TaskResponseModel.id == response_id).first()
    if not task_resp:
        raise HTTPException(status_code=404, detail=f"Task response '{response_id}' not found")

    if not payload.reviewer_id or not payload.reviewer_id.strip():
        raise HTTPException(status_code=400, detail="Reviewer ID must not be blank")

    if not payload.reviewer_notes or len(payload.reviewer_notes.strip()) < 5:
        raise HTTPException(status_code=400, detail="Substantive reviewer notes are required")

    original_scores_dict = json.loads(task_resp.dimension_scores) if task_resp.dimension_scores else {}

    # Clamp overridden scores to valid rubric boundaries
    validated_overrides = DimensionScores(
        factual_correctness=clamp_dimension_score("factual_correctness", payload.score_overrides.factual_correctness),
        completeness=clamp_dimension_score("completeness", payload.score_overrides.completeness),
        instruction_adherence=clamp_dimension_score("instruction_adherence", payload.score_overrides.instruction_adherence),
        language_naturalness=clamp_dimension_score("language_naturalness", payload.score_overrides.language_naturalness),
        safety_appropriateness=clamp_dimension_score("safety_appropriateness", payload.score_overrides.safety_appropriateness),
    )

    now_iso = datetime.now(timezone.utc).isoformat()

    # Save human review audit record
    review_record = HumanReviewModel(
        response_id=task_resp.id,
        reviewer_id=payload.reviewer_id.strip(),
        reviewed_at=now_iso,
        original_scores=json.dumps(original_scores_dict),
        overridden_scores=json.dumps(validated_overrides.model_dump()),
        reviewer_notes=payload.reviewer_notes.strip(),
    )
    db.add(review_record)

    # Update task response record
    task_resp.dimension_scores = json.dumps(validated_overrides.model_dump())
    task_resp.is_provisional = False
    task_resp.evaluation_method = "human_validated"
    task_resp.evidence_notes = f"Human verified by {payload.reviewer_id.strip()}: {payload.reviewer_notes.strip()}"

    db.commit()

    return HumanReviewResponse(
        status="success",
        response_id=task_resp.id,
        updated_scores=validated_overrides,
        is_provisional=False,
        evaluation_method="human_validated",
        reviewer_id=payload.reviewer_id.strip(),
        reviewed_at=now_iso,
        reviewer_notes=payload.reviewer_notes.strip(),
    )

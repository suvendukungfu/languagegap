"""Evaluation Runner for executing benchmark tasks and persisting results."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import List, Optional

from app.benchmark.loader import BenchmarkRepository
from app.db.database import SessionLocal
from app.db.models import EvaluationRunModel, TaskResponseModel
from app.evaluation.engine import EvaluationEngine
from app.providers.factory import get_provider
from app.schemas.benchmark import SupportedLanguage
from app.schemas.provider import SamplingParams


async def execute_evaluation_run(
    run_id: str,
    provider_name: Optional[str] = None,
    task_id_filter: Optional[List[str]] = None,
    sampling_params: Optional[SamplingParams] = None,
    db: Optional[SessionLocal] = None,
) -> None:
    """Execute evaluation tasks, evaluate outputs, and update database records."""
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True
    try:
        run = db.query(EvaluationRunModel).filter(EvaluationRunModel.id == run_id).first()
        if not run:
            return

        run.status = "running"
        db.commit()

        # Load benchmark repository
        repo = BenchmarkRepository()
        tasks = repo.list_tasks()
        if task_id_filter:
            tasks = [t for t in tasks if t.task_id in task_id_filter]

        if not tasks:
            run.status = "failed"
            run.error_message = "No tasks found matching requested criteria"
            run.completed_at = datetime.now(timezone.utc).isoformat()
            db.commit()
            return

        # Initialize provider and engine
        provider = get_provider(provider_name or run.provider_name)
        engine = EvaluationEngine()
        params = sampling_params or SamplingParams()

        languages = [SupportedLanguage.EN, SupportedLanguage.HI, SupportedLanguage.PA, SupportedLanguage.OR]

        for task in tasks:
            for lang in languages:
                variant = task.variants.get(lang)
                if not variant:
                    continue

                try:
                    generation = await provider.generate(
                        prompt=variant.prompt,
                        sampling_params=params,
                    )
                    eval_result = engine.evaluate_response(
                        task=task,
                        language=lang,
                        generation=generation,
                    )

                    # Persist response and scores
                    task_record = TaskResponseModel(
                        evaluation_id=run.id,
                        task_id=task.task_id,
                        language=lang.value,
                        prompt=variant.prompt,
                        response_text=generation.text,
                        latency_ms=generation.latency_ms,
                        token_usage=json.dumps(generation.usage.model_dump()),
                        dimension_scores=json.dumps(eval_result.dimension_scores.model_dump()),
                        fact_coverage=json.dumps([fc.model_dump() for fc in eval_result.fact_coverage]),
                        unsupported_claims=json.dumps([uc.model_dump() for uc in eval_result.unsupported_claims]),
                        is_provisional=eval_result.is_provisional,
                        evaluation_method=eval_result.evaluation_method.value,
                        evidence_notes=eval_result.evidence_notes,
                    )
                    db.add(task_record)
                    db.commit()

                except Exception as e:
                    # Log failure for individual prompt without crashing entire run
                    error_record = TaskResponseModel(
                        evaluation_id=run.id,
                        task_id=task.task_id,
                        language=lang.value,
                        prompt=variant.prompt,
                        response_text=f"[Error during generation: {e}]",
                        latency_ms=0.0,
                        dimension_scores=json.dumps({
                            "factual_correctness": 0,
                            "completeness": 0,
                            "instruction_adherence": 0,
                            "language_naturalness": 0,
                            "safety_appropriateness": 0,
                            "total_score": 0,
                        }),
                        fact_coverage="[]",
                        unsupported_claims="[]",
                        is_provisional=True,
                        evaluation_method="automated_provisional",
                        evidence_notes=f"Generation failed: {e}",
                    )
                    db.add(error_record)
                    db.commit()

        # Mark run completed
        run.status = "completed"
        run.completed_at = datetime.now(timezone.utc).isoformat()
        db.commit()

    except Exception as e:
        db.rollback()
        run = db.query(EvaluationRunModel).filter(EvaluationRunModel.id == run_id).first()
        if run:
            run.status = "failed"
            run.error_message = str(e)
            run.completed_at = datetime.now(timezone.utc).isoformat()
            db.commit()
    finally:
        if should_close:
            db.close()

"""Benchmark dataset discovery endpoint."""

from typing import List
from fastapi import APIRouter
from app.benchmark.loader import BenchmarkRepository
from app.schemas.api import BenchmarkSummary

router = APIRouter(tags=["benchmarks"])


@router.get("/benchmarks", response_model=List[BenchmarkSummary])
def list_benchmarks() -> List[BenchmarkSummary]:
    """Return available benchmark datasets and task listings."""
    repo = BenchmarkRepository()
    dataset = repo.dataset

    task_summaries = []
    for task in dataset.tasks:
        task_summaries.append({
            "task_id": task.task_id,
            "category": task.category,
            "topic": task.topic,
            "difficulty": task.difficulty,
            "canonical_intent": task.canonical_intent,
            "required_facts_count": len(task.required_facts),
            "disallowed_claims_count": len(task.disallowed_claims),
            "source_references": task.source_references,
            "variants": {
                lang.value: {
                    "script": var.script.value,
                    "review_status": var.review_status.value,
                    "prompt": var.prompt,
                }
                for lang, var in task.variants.items()
            },
        })

    return [
        BenchmarkSummary(
            dataset_id=dataset.dataset_id,
            version=dataset.version,
            title=dataset.title,
            description=dataset.description,
            task_count=len(dataset.tasks),
            tasks=task_summaries,
        )
    ]

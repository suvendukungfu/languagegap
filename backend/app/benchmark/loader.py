"""Benchmark Dataset Loader.

Loads, parses, and validates benchmark datasets from JSON storage.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from app.schemas.benchmark import BenchmarkDatasetSchema, BenchmarkTaskSchema, SupportedLanguage

# Default benchmark location relative to repository root or backend root
DEFAULT_DATASET_REL_PATH = Path("data/benchmarks/v1/digital_literacy.json")


def resolve_benchmark_path(file_path: Optional[Path | str] = None) -> Path:
    """Resolve absolute path to benchmark JSON file."""
    if file_path:
        p = Path(file_path)
        if p.is_absolute():
            return p
        # Check relative to cwd
        if p.exists():
            return p.resolve()

    # Search common candidate locations
    candidates = [
        Path.cwd() / DEFAULT_DATASET_REL_PATH,
        Path.cwd() / "backend" / DEFAULT_DATASET_REL_PATH,
        Path(__file__).parent.parent.parent / DEFAULT_DATASET_REL_PATH,
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate.resolve()

    raise FileNotFoundError(f"Could not locate benchmark dataset at candidates: {candidates}")


def load_benchmark_dataset(file_path: Optional[Path | str] = None) -> BenchmarkDatasetSchema:
    """Load and validate benchmark dataset from disk using Pydantic."""
    path = resolve_benchmark_path(file_path)
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return BenchmarkDatasetSchema.model_validate(data)


class BenchmarkRepository:
    """In-memory benchmark repository initialized from validated dataset."""

    def __init__(self, dataset: Optional[BenchmarkDatasetSchema] = None):
        self._dataset = dataset or load_benchmark_dataset()
        self._task_map = {t.task_id: t for t in self._dataset.tasks}

    @property
    def dataset(self) -> BenchmarkDatasetSchema:
        return self._dataset

    @property
    def version(self) -> str:
        return self._dataset.version

    def list_tasks(self) -> list[BenchmarkTaskSchema]:
        """Return all tasks in the benchmark."""
        return list(self._dataset.tasks)

    def get_task(self, task_id: str) -> Optional[BenchmarkTaskSchema]:
        """Fetch a specific task by task_id."""
        return self._task_map.get(task_id)

    def get_prompt_variant(self, task_id: str, language: SupportedLanguage) -> Optional[str]:
        """Fetch the exact prompt for a task in a specific language."""
        task = self.get_task(task_id)
        if not task:
            return None
        variant = task.variants.get(language)
        return variant.prompt if variant else None

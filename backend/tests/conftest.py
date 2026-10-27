"""Pytest Configuration and Shared Fixtures."""

import json
from pathlib import Path
import pytest

from app.schemas.benchmark import BenchmarkDatasetSchema
from app.benchmark.loader import load_benchmark_dataset, resolve_benchmark_path


@pytest.fixture
def benchmark_file_path() -> Path:
    """Return verified path to digital_literacy.json benchmark."""
    return resolve_benchmark_path()


@pytest.fixture
def raw_benchmark_data(benchmark_file_path: Path) -> dict:
    """Return raw JSON dictionary of default benchmark."""
    with open(benchmark_file_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def default_dataset(benchmark_file_path: Path) -> BenchmarkDatasetSchema:
    """Return parsed and validated BenchmarkDatasetSchema."""
    return load_benchmark_dataset(benchmark_file_path)

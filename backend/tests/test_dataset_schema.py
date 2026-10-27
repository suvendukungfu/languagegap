"""Tests for Benchmark Dataset Schema and Validation Rules.

Validates that:
- Benchmark dataset conforms to Pydantic v2 schemas.
- Missing required language variants (en, hi, pa, or) are rejected.
- Duplicate task IDs are rejected.
- Invalid metadata (e.g. unknown difficulty, short intents) is rejected.
- Review provenance statuses are enforced (provisional cannot claim approved status).
- Source references and required facts are strictly verified.
"""

import copy
import pytest
from pydantic import ValidationError

from app.schemas.benchmark import (
    BenchmarkDatasetSchema,
    BenchmarkTaskSchema,
    ReviewStatus,
    SupportedLanguage,
    SupportedScript,
    TaskVariantSchema,
)
from app.benchmark.validator import DatasetValidator


def test_default_dataset_validates(benchmark_file_path):
    """Verify that the official v1 digital_literacy benchmark is 100% valid."""
    validator = DatasetValidator(benchmark_file_path)
    is_valid, dataset, issues = validator.validate()

    assert is_valid is True, f"Validation failed with issues: {[str(i) for i in issues]}"
    assert dataset is not None
    assert dataset.dataset_id == "digital_literacy"
    assert dataset.version == "1.0.0"
    assert len(dataset.tasks) == 6


def test_tasks_have_all_four_languages(default_dataset):
    """Verify that every task defines en, hi, pa, and or variants."""
    expected_langs = {SupportedLanguage.EN, SupportedLanguage.HI, SupportedLanguage.PA, SupportedLanguage.OR}
    for task in default_dataset.tasks:
        present_langs = set(task.variants.keys())
        assert present_langs == expected_langs, f"Task {task.task_id} missing languages: {expected_langs - present_langs}"


def test_missing_language_variant_raises_validation_error(raw_benchmark_data):
    """Task must fail validation if any of en, hi, pa, or is missing."""
    data = copy.deepcopy(raw_benchmark_data)
    # Remove 'or' variant from first task
    del data["tasks"][0]["variants"]["or"]

    with pytest.raises(ValidationError) as exc_info:
        BenchmarkDatasetSchema.model_validate(data)

    assert "missing required language variants" in str(exc_info.value)
    assert "'or'" in str(exc_info.value)


def test_duplicate_task_id_raises_validation_error(raw_benchmark_data):
    """Dataset must reject duplicate task IDs."""
    data = copy.deepcopy(raw_benchmark_data)
    duplicate_task = copy.deepcopy(data["tasks"][0])
    data["tasks"].append(duplicate_task)

    with pytest.raises(ValidationError) as exc_info:
        BenchmarkDatasetSchema.model_validate(data)

    assert "Duplicate task IDs found" in str(exc_info.value)
    assert duplicate_task["task_id"] in str(exc_info.value)


def test_invalid_task_id_format_raises_validation_error(raw_benchmark_data):
    """Task ID must follow canonical naming pattern."""
    data = copy.deepcopy(raw_benchmark_data)
    data["tasks"][0]["task_id"] = "invalid_lowercase_id"

    with pytest.raises(ValidationError) as exc_info:
        BenchmarkDatasetSchema.model_validate(data)

    assert "task_id" in str(exc_info.value)


def test_insufficient_required_facts_raises_validation_error(raw_benchmark_data):
    """Every task must supply at least 2 required atomic facts."""
    data = copy.deepcopy(raw_benchmark_data)
    data["tasks"][0]["required_facts"] = ["Single lonely fact."]

    with pytest.raises(ValidationError) as exc_info:
        BenchmarkDatasetSchema.model_validate(data)

    assert "required_facts" in str(exc_info.value)


def test_missing_source_references_raises_validation_error(raw_benchmark_data):
    """Every task must supply at least 1 authoritative reference citation."""
    data = copy.deepcopy(raw_benchmark_data)
    data["tasks"][0]["source_references"] = []

    with pytest.raises(ValidationError) as exc_info:
        BenchmarkDatasetSchema.model_validate(data)

    assert "source_references" in str(exc_info.value)


def test_review_status_provenance_contract():
    """Verify that unreviewed variants are never classified as human-approved."""
    provisional = ReviewStatus.PROVISIONAL_TRANSLATION
    pending = ReviewStatus.PENDING_NATIVE_REVIEW
    reviewed = ReviewStatus.NATIVE_REVIEWED
    authored = ReviewStatus.NATIVE_AUTHORED

    assert provisional.is_human_approved is False
    assert pending.is_human_approved is False
    assert reviewed.is_human_approved is True
    assert authored.is_human_approved is True


def test_provisional_variant_validation_warning(benchmark_file_path, raw_benchmark_data):
    """Validator must issue a WARNING when a variant is provisional, without crashing schema."""
    data = copy.deepcopy(raw_benchmark_data)
    data["tasks"][0]["variants"]["pa"]["review_status"] = "provisional_translation"

    import tempfile, json
    with tempfile.NamedTemporaryFile("w+", suffix=".json", encoding="utf-8") as tmp:
        json.dump(data, tmp)
        tmp.flush()

        validator = DatasetValidator(tmp.name)
        is_valid, dataset, issues = validator.validate()

        assert is_valid is True
        warnings = [i for i in issues if i.severity == "WARNING" and "provisional" in i.message]
        assert len(warnings) >= 1

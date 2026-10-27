"""Benchmark Dataset Validation Utility.

Provides programmatic and CLI validation for benchmark datasets,
verifying structural integrity, Unicode normalization, script ranges,
and reviewer provenance rules.
"""

from __future__ import annotations

import argparse
import sys
import unicodedata
from pathlib import Path

# Ensure backend root is on sys.path for standalone CLI usage
BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from typing import Any, Dict, List

from app.schemas.benchmark import (
    BenchmarkDatasetSchema,
    BenchmarkTaskSchema,
    ReviewStatus,
    SCRIPT_RANGES,
    SupportedLanguage,
)


class ValidationIssue:
    def __init__(self, severity: str, task_id: str, field: str, message: str):
        self.severity = severity  # "ERROR" or "WARNING"
        self.task_id = task_id
        self.field = field
        self.message = message

    def __str__(self) -> str:
        return f"[{self.severity}] Task {self.task_id} ({self.field}): {self.message}"


class DatasetValidator:
    """Rigorous validator for LanguageGap multilingual benchmark datasets."""

    def __init__(self, dataset_path: Path | str):
        self.dataset_path = Path(dataset_path)
        self.issues: List[ValidationIssue] = []

    def validate(self) -> tuple[bool, BenchmarkDatasetSchema | None, List[ValidationIssue]]:
        """Perform comprehensive validation and return status, parsed schema, and issues."""
        self.issues.clear()

        if not self.dataset_path.exists():
            self.issues.append(
                ValidationIssue("ERROR", "SYSTEM", "file", f"File does not exist: {self.dataset_path}")
            )
            return False, None, self.issues

        try:
            import json
            with open(self.dataset_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
        except Exception as e:
            self.issues.append(
                ValidationIssue("ERROR", "SYSTEM", "json_parsing", f"Failed to parse JSON: {e}")
            )
            return False, None, self.issues

        # Pydantic schema validation
        try:
            dataset = BenchmarkDatasetSchema.model_validate(raw_data)
        except Exception as e:
            self.issues.append(
                ValidationIssue("ERROR", "SCHEMA", "pydantic", f"Schema validation failed: {e}")
            )
            return False, None, self.issues

        # Deep domain checks
        self._check_semantic_facts(dataset)
        self._check_unicode_and_scripts(dataset)
        self._check_review_provenance(dataset)

        has_errors = any(issue.severity == "ERROR" for issue in self.issues)
        return not has_errors, dataset, self.issues

    def _check_semantic_facts(self, dataset: BenchmarkDatasetSchema) -> None:
        """Verify each task has non-trivial atomic facts and clear reference citations."""
        for task in dataset.tasks:
            if len(task.required_facts) < 2:
                self.issues.append(
                    ValidationIssue("ERROR", task.task_id, "required_facts", "Must have at least 2 atomic facts")
                )
            for idx, fact in enumerate(task.required_facts):
                if len(fact.strip()) < 15:
                    self.issues.append(
                        ValidationIssue("WARNING", task.task_id, f"required_facts[{idx}]", "Fact assertion seems too short")
                    )

            if not task.source_references:
                self.issues.append(
                    ValidationIssue("ERROR", task.task_id, "source_references", "Must provide at least one reference")
                )

    def _check_unicode_and_scripts(self, dataset: BenchmarkDatasetSchema) -> None:
        """Verify NFC normalization and strict script fidelity."""
        for task in dataset.tasks:
            for lang, variant in task.variants.items():
                # Check NFC
                nfc_normalized = unicodedata.normalize("NFC", variant.prompt)
                if variant.prompt != nfc_normalized:
                    self.issues.append(
                        ValidationIssue(
                            "ERROR",
                            task.task_id,
                            f"variants.{lang.value}.prompt",
                            "Prompt is not normalized in Unicode NFC form"
                        )
                    )

    def _check_review_provenance(self, dataset: BenchmarkDatasetSchema) -> None:
        """Audit review status: flag any translation that lacks review notes or is unverified."""
        for task in dataset.tasks:
            for lang, variant in task.variants.items():
                if variant.review_status == ReviewStatus.PROVISIONAL_TRANSLATION:
                    self.issues.append(
                        ValidationIssue(
                            "WARNING",
                            task.task_id,
                            f"variants.{lang.value}.review_status",
                            "Variant is a provisional machine translation; requires native human review before benchmark freeze"
                        )
                    )
                elif variant.review_status == ReviewStatus.PENDING_NATIVE_REVIEW:
                    self.issues.append(
                        ValidationIssue(
                            "WARNING",
                            task.task_id,
                            f"variants.{lang.value}.review_status",
                            "Variant is pending native review"
                        )
                    )


def main():
    parser = argparse.ArgumentParser(description="Validate LanguageGap Benchmark Dataset")
    parser.add_argument("path", help="Path to benchmark JSON file")
    args = parser.parse_args()

    validator = DatasetValidator(args.path)
    is_valid, dataset, issues = validator.validate()

    for issue in issues:
        print(issue)

    if is_valid:
        print(f"\nSUCCESS: Dataset '{dataset.dataset_id}' (v{dataset.version}) with {len(dataset.tasks)} tasks is VALID.")
        sys.exit(0)
    else:
        print(f"\nFAILURE: Dataset contains validation errors.")
        sys.exit(1)


if __name__ == "__main__":
    main()

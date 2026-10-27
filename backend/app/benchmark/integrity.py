"""Benchmark Integrity Validation Service.

Provides rigorous, reproducible integrity validation for LanguageGap multilingual benchmarks.
Verifies four-language parity (en, hi, pa, or), task uniqueness, atomic facts,
script ranges, and Unicode normalization without silently modifying or repairing data.
"""

from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
from typing import Any, Dict, List, Optional, Union
import unicodedata

from app.schemas.benchmark import SCRIPT_RANGES, SupportedLanguage
from app.schemas.passport import BenchmarkIntegrityReport

EXPECTED_LANGUAGES: List[str] = ["en", "hi", "pa", "or"]


class BenchmarkIntegrityValidator:
    """Rigorous integrity auditor for multilingual benchmark datasets."""

    def __init__(
        self,
        source: Union[Path, str, bytes, Dict[str, Any]],
        expected_languages: Optional[List[str]] = None,
    ):
        self.source = source
        self.expected_languages = expected_languages or list(EXPECTED_LANGUAGES)

    def validate(self) -> BenchmarkIntegrityReport:
        """Execute full benchmark validation and return structured integrity report."""
        errors: List[str] = []
        warnings: List[str] = []
        raw_bytes: bytes = b""
        raw_data: Optional[Dict[str, Any]] = None

        # 1. Resolve source and raw bytes for deterministic SHA-256 computation
        if isinstance(self.source, bytes):
            raw_bytes = self.source
            try:
                raw_data = json.loads(raw_bytes.decode("utf-8"))
            except Exception as e:
                errors.append(f"Failed to parse benchmark JSON from bytes: {e}")
        elif isinstance(self.source, (Path, str)):
            p = Path(self.source)
            if not p.exists():
                errors.append(f"Benchmark file does not exist: {p}")
                return BenchmarkIntegrityReport(
                    valid=False,
                    errors=errors,
                    warnings=warnings,
                    benchmark_id="unknown",
                    benchmark_version="unknown",
                    task_count=0,
                    language_coverage={},
                    expected_languages=self.expected_languages,
                    benchmark_sha256="",
                    verified_at=datetime.now(timezone.utc).isoformat(),
                )
            try:
                raw_bytes = p.read_bytes()
                raw_data = json.loads(raw_bytes.decode("utf-8"))
            except Exception as e:
                errors.append(f"Failed to read and parse benchmark file '{p}': {e}")
        elif isinstance(self.source, dict):
            raw_data = self.source
            raw_bytes = json.dumps(raw_data, sort_keys=True, ensure_ascii=False).encode("utf-8")
        else:
            errors.append(f"Unsupported benchmark source type: {type(self.source)}")

        # Calculate exact SHA-256 fingerprint
        benchmark_sha256 = hashlib.sha256(raw_bytes).hexdigest() if raw_bytes else ""

        if raw_data is None or not isinstance(raw_data, dict):
            errors.append("Benchmark dataset must be a valid JSON object")
            return BenchmarkIntegrityReport(
                valid=False,
                errors=errors,
                warnings=warnings,
                benchmark_id="unknown",
                benchmark_version="unknown",
                task_count=0,
                language_coverage={},
                expected_languages=self.expected_languages,
                benchmark_sha256=benchmark_sha256,
                verified_at=datetime.now(timezone.utc).isoformat(),
            )

        # 2. Dataset Root Metadata Validation
        benchmark_id = str(raw_data.get("dataset_id", "unknown"))
        benchmark_version = str(raw_data.get("version", "unknown"))

        if not raw_data.get("dataset_id"):
            errors.append("Dataset root missing required field 'dataset_id'")
        if not raw_data.get("version"):
            errors.append("Dataset root missing required field 'version'")
        elif not re.match(r"^[0-9]+\.[0-9]+\.[0-9]+$", str(raw_data.get("version"))):
            warnings.append(f"Benchmark version '{benchmark_version}' does not follow strict SemVer format (e.g. 1.0.0)")

        tasks_raw = raw_data.get("tasks")
        if not isinstance(tasks_raw, list):
            errors.append("Dataset root 'tasks' must be a non-empty array")
            tasks_raw = []

        if len(tasks_raw) == 0:
            errors.append("Benchmark dataset contains zero tasks")

        task_count = len(tasks_raw)
        language_coverage: Dict[str, int] = {lang: 0 for lang in self.expected_languages}
        seen_task_ids: set[str] = set()

        # 3. Individual Task & Variant Integrity Audits
        for idx, task in enumerate(tasks_raw):
            if not isinstance(task, dict):
                errors.append(f"Task index {idx} is malformed: expected JSON object, got {type(task).__name__}")
                continue

            task_id = str(task.get("task_id", f"INDEX-{idx}"))

            # Uniqueness check
            if not task.get("task_id"):
                errors.append(f"Task index {idx} missing required field 'task_id'")
            elif task_id in seen_task_ids:
                errors.append(f"Duplicate task ID detected: '{task_id}'")
            else:
                seen_task_ids.add(task_id)

            # Canonical Intent
            canonical_intent = task.get("canonical_intent")
            if not canonical_intent or not isinstance(canonical_intent, str) or len(canonical_intent.strip()) < 10:
                errors.append(f"Task '{task_id}' missing or too short 'canonical_intent' (minimum 10 chars)")

            # Required Facts Assertions
            required_facts = task.get("required_facts")
            if not isinstance(required_facts, list) or len(required_facts) < 2:
                errors.append(f"Task '{task_id}' must provide at least 2 atomic required_facts")
            else:
                for f_idx, fact in enumerate(required_facts):
                    if not isinstance(fact, str) or len(fact.strip()) == 0:
                        errors.append(f"Task '{task_id}' required_facts[{f_idx}] is empty or invalid")
                    elif len(fact.strip()) < 15:
                        warnings.append(f"Task '{task_id}' required_facts[{f_idx}] assertion may be too brief (<15 chars)")

            # Source References
            references = task.get("source_references")
            if not isinstance(references, list) or len(references) == 0:
                warnings.append(f"Task '{task_id}' lacks external source_references")

            # Multilingual Variants
            variants = task.get("variants")
            if not isinstance(variants, dict):
                errors.append(f"Task '{task_id}' missing 'variants' object mapping")
                continue

            # Check presence of all expected languages
            for expected_lang in self.expected_languages:
                if expected_lang not in variants:
                    errors.append(f"Task '{task_id}' missing required language variant: '{expected_lang}'")
                else:
                    var_data = variants[expected_lang]
                    if not isinstance(var_data, dict):
                        errors.append(f"Task '{task_id}' variant '{expected_lang}' must be a dictionary")
                        continue

                    prompt = var_data.get("prompt")
                    if not prompt or not isinstance(prompt, str) or len(prompt.strip()) == 0:
                        errors.append(f"Task '{task_id}' variant '{expected_lang}' has an empty or missing prompt")
                        continue

                    # Unicode encodability and NFC normalization audit
                    try:
                        encoded = prompt.encode("utf-8")
                        decoded = encoded.decode("utf-8")
                        if decoded != prompt:
                            errors.append(f"Task '{task_id}' variant '{expected_lang}' failed UTF-8 roundtrip")
                    except Exception as e:
                        errors.append(f"Task '{task_id}' variant '{expected_lang}' failed UTF-8 encoding: {e}")

                    # Unicode NFC normalization check
                    nfc_prompt = unicodedata.normalize("NFC", prompt)
                    if prompt != nfc_prompt:
                        errors.append(
                            f"Task '{task_id}' variant '{expected_lang}' prompt is not normalized in Unicode NFC form"
                        )

                    # Script code points validation
                    try:
                        supported_enum = SupportedLanguage(expected_lang)
                        expected_script, pattern = SCRIPT_RANGES[supported_enum]
                        if not re.search(pattern, prompt):
                            errors.append(
                                f"Task '{task_id}' variant '{expected_lang}' prompt lacks valid "
                                f"{expected_script.value} Unicode script code points"
                            )
                    except ValueError:
                        pass

                    # Provenance & review status
                    rev_status = var_data.get("review_status", "")
                    if rev_status in ("provisional_translation", "pending_native_review"):
                        warnings.append(
                            f"Task '{task_id}' variant '{expected_lang}' has provisional status: '{rev_status}'"
                        )

                    language_coverage[expected_lang] += 1

        is_valid = len(errors) == 0

        return BenchmarkIntegrityReport(
            valid=is_valid,
            errors=errors,
            warnings=warnings,
            benchmark_id=benchmark_id,
            benchmark_version=benchmark_version,
            task_count=task_count,
            language_coverage=language_coverage,
            expected_languages=self.expected_languages,
            benchmark_sha256=benchmark_sha256,
            verified_at=datetime.now(timezone.utc).isoformat(),
        )


def validate_benchmark_integrity(
    source: Optional[Union[Path, str, bytes, Dict[str, Any]]] = None,
) -> BenchmarkIntegrityReport:
    """Convenience function to run integrity validation against default or given benchmark."""
    if source is None:
        from app.benchmark.loader import resolve_benchmark_path
        source = resolve_benchmark_path()

    validator = BenchmarkIntegrityValidator(source)
    return validator.validate()

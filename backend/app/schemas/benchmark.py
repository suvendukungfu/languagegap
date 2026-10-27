"""Multilingual Benchmark Data Schemas.

Defines Pydantic models for benchmark tasks, question variants across
supported languages (en, hi, pa, or), atomic facts, and review statuses.
"""

from __future__ import annotations

import re
import unicodedata
from enum import Enum
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class ReviewStatus(str, Enum):
    """Review and provenance status of a question variant."""
    NATIVE_AUTHORED = "native_authored"
    NATIVE_REVIEWED = "native_reviewed"
    PENDING_NATIVE_REVIEW = "pending_native_review"
    PROVISIONAL_TRANSLATION = "provisional_translation"

    @property
    def is_human_approved(self) -> bool:
        """Return True only if validated by a native speaker."""
        return self in (ReviewStatus.NATIVE_AUTHORED, ReviewStatus.NATIVE_REVIEWED)


class SupportedLanguage(str, Enum):
    """Initial four supported evaluation languages."""
    EN = "en"
    HI = "hi"
    PA = "pa"
    OR = "or"


class SupportedScript(str, Enum):
    """Writing systems corresponding to the supported languages."""
    LATIN = "Latin"
    DEVANAGARI = "Devanagari"
    GURMUKHI = "Gurmukhi"
    ODIA = "Odia"


# Mapping from language code to expected primary script and Unicode range
SCRIPT_RANGES: Dict[SupportedLanguage, tuple[SupportedScript, str]] = {
    SupportedLanguage.EN: (SupportedScript.LATIN, r"[\u0020-\u007E]"),
    SupportedLanguage.HI: (SupportedScript.DEVANAGARI, r"[\u0900-\u097F]"),
    SupportedLanguage.PA: (SupportedScript.GURMUKHI, r"[\u0A00-\u0A7F]"),
    SupportedLanguage.OR: (SupportedScript.ODIA, r"[\u0B00-\u0B7F]"),
}


class TaskVariantSchema(BaseModel):
    """Language-specific phrasing of a benchmark task."""
    language: SupportedLanguage
    script: SupportedScript
    prompt: str = Field(..., min_length=10, description="The natural question prompt in target script")
    review_status: ReviewStatus = Field(
        default=ReviewStatus.PENDING_NATIVE_REVIEW,
        description="Provenance and review status"
    )
    author_notes: Optional[str] = Field(default=None, description="Linguistic context, translation notes, or source rationale")
    script_direction: Literal["ltr"] = "ltr"

    @field_validator("prompt", mode="before")
    @classmethod
    def normalize_unicode(cls, v: str) -> str:
        """Enforce Unicode NFC normalization and clean leading/trailing whitespace."""
        if isinstance(v, str):
            return unicodedata.normalize("NFC", v.strip())
        return v

    @model_validator(mode="after")
    def validate_script_and_text(self) -> TaskVariantSchema:
        """Verify that script matches the language and prompt contains expected script characters."""
        expected_script, pattern = SCRIPT_RANGES[self.language]
        if self.script != expected_script:
            raise ValueError(
                f"Language '{self.language.value}' expects script '{expected_script.value}', "
                f"got '{self.script.value}'"
            )

        if not re.search(pattern, self.prompt):
            raise ValueError(
                f"Prompt for language '{self.language.value}' does not contain valid "
                f"'{expected_script.value}' Unicode code points: {self.prompt[:40]}..."
            )
        return self


class BenchmarkTaskSchema(BaseModel):
    """Canonical benchmark task with shared intent and multilingual variants."""
    task_id: str = Field(..., pattern=r"^[A-Z0-9]+-[0-9]{2}-[A-Z0-9_-]+$", description="Stable unique identifier")
    category: str = Field(..., min_length=2, description="Domain categorization, e.g. digital_literacy")
    topic: str = Field(..., min_length=2, description="Specific topic, e.g. account_security_and_2fa")
    difficulty: Literal["beginner", "intermediate", "advanced"] = "beginner"
    canonical_intent: str = Field(..., min_length=15, description="Language-agnostic intent description")
    required_facts: List[str] = Field(..., min_length=2, description="Atomic required facts for complete answer")
    disallowed_claims: List[str] = Field(default_factory=list, description="Unsupported, misleading or unsafe claims")
    source_references: List[str] = Field(..., min_length=1, description="Public authoritative reference citations")
    variants: Dict[SupportedLanguage, TaskVariantSchema] = Field(..., description="Mapping of language to variant")

    @model_validator(mode="after")
    def validate_required_languages(self) -> BenchmarkTaskSchema:
        """Ensure all initial required languages (en, hi, pa, or) are present."""
        missing = [lang for lang in SupportedLanguage if lang not in self.variants]
        if missing:
            missing_codes = [m.value for m in missing]
            raise ValueError(
                f"Task '{self.task_id}' is missing required language variants: {missing_codes}"
            )
        return self


class BenchmarkDatasetSchema(BaseModel):
    """Root container for a versioned collection of benchmark tasks."""
    dataset_id: str = Field(..., min_length=3)
    version: str = Field(..., pattern=r"^[0-9]+\.[0-9]+\.[0-9]+$")
    title: str = Field(..., min_length=3)
    description: str = Field(..., min_length=10)
    created_at: str = Field(..., description="ISO 8601 date string")
    methodology_url: str = Field(default="docs/benchmark-methodology.md")
    tasks: List[BenchmarkTaskSchema] = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_unique_task_ids(self) -> BenchmarkDatasetSchema:
        """Enforce uniqueness of task IDs across the dataset."""
        seen = set()
        duplicates = []
        for task in self.tasks:
            if task.task_id in seen:
                duplicates.append(task.task_id)
            seen.add(task.task_id)
        if duplicates:
            raise ValueError(f"Duplicate task IDs found in dataset: {duplicates}")
        return self

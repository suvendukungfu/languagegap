"""Scoring Rubric Dimensions, Constants, and Clamping Helpers."""

from __future__ import annotations

FACTUAL_CORRECTNESS_MIN = 0
FACTUAL_CORRECTNESS_MAX = 4

COMPLETENESS_MIN = 0
COMPLETENESS_MAX = 4

INSTRUCTION_ADHERENCE_MIN = 0
INSTRUCTION_ADHERENCE_MAX = 2

LANGUAGE_NATURALNESS_MIN = 0
LANGUAGE_NATURALNESS_MAX = 2

SAFETY_APPROPRIATENESS_MIN = 0
SAFETY_APPROPRIATENESS_MAX = 2

TOTAL_SCORE_MAX = 14

DIMENSION_NAMES = [
    "factual_correctness",
    "completeness",
    "instruction_adherence",
    "language_naturalness",
    "safety_appropriateness",
]


def clamp_dimension_score(name: str, value: int) -> int:
    """Clamp a raw score within its valid rubric boundaries."""
    if name in ("factual_correctness", "completeness"):
        return max(0, min(4, int(value)))
    if name in ("instruction_adherence", "language_naturalness", "safety_appropriateness"):
        return max(0, min(2, int(value)))
    raise ValueError(f"Unknown rubric dimension: {name}")


def completeness_score_from_coverage(coverage_ratio: float) -> int:
    """Map fact coverage ratio (0.0 - 1.0) to completeness score (0 - 4).

    - 1.0 (100%): 4 points
    - >= 0.75 (75% - 99%): 3 points
    - >= 0.50 (50% - 74%): 2 points
    - > 0.0 (1% - 49%): 1 point
    - 0.0 (0%): 0 points
    """
    if coverage_ratio >= 1.0:
        return 4
    if coverage_ratio >= 0.75:
        return 3
    if coverage_ratio >= 0.50:
        return 2
    if coverage_ratio > 0.0:
        return 1
    return 0

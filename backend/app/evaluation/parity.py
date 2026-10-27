"""Language Parity Gap Calculator.

Aggregates paired task-level evaluations across English, Hindi, Punjabi,
and Odia, computing composite and dimensional parity gaps.
"""

from __future__ import annotations

from collections import defaultdict
from typing import Dict, List

from app.evaluation.rubric import DIMENSION_NAMES
from app.schemas.benchmark import SupportedLanguage
from app.schemas.evaluation import (
    DimensionalParityGap,
    ParityGapReport,
    TaskEvaluationResult,
)


class ParityCalculator:
    """Computes cross-lingual parity gaps over paired evaluation results."""

    @staticmethod
    def compute_parity_report(
        evaluations: List[TaskEvaluationResult],
        benchmark_version: str = "1.0.0",
    ) -> ParityGapReport:
        """Compute aggregate parity gap and per-dimension breakdowns."""
        if not evaluations:
            raise ValueError("Cannot compute parity report for empty evaluation list")

        model_id = evaluations[0].provider_metadata.model_id
        provider_name = evaluations[0].provider_metadata.provider_name
        is_provisional = any(e.is_provisional for e in evaluations)

        # Group evaluations by task_id
        task_groups: Dict[str, Dict[SupportedLanguage, TaskEvaluationResult]] = defaultdict(dict)
        for eval_item in evaluations:
            task_groups[eval_item.task_id][eval_item.language] = eval_item

        # Filter for paired task sets (all 4 languages present)
        required_langs = {SupportedLanguage.EN, SupportedLanguage.HI, SupportedLanguage.PA, SupportedLanguage.OR}
        paired_tasks = [
            lang_dict
            for lang_dict in task_groups.values()
            if required_langs.issubset(set(lang_dict.keys()))
        ]

        # Use paired tasks if available, otherwise aggregate across all tasks
        target_group_list = paired_tasks if paired_tasks else list(task_groups.values())

        # Calculate mean scores per language
        lang_totals: Dict[SupportedLanguage, float] = defaultdict(float)
        lang_counts: Dict[SupportedLanguage, int] = defaultdict(int)

        # Dimensional totals per language: dim_name -> lang -> sum
        dim_totals: Dict[str, Dict[SupportedLanguage, float]] = {
            dim: defaultdict(float) for dim in DIMENSION_NAMES
        }

        for group in target_group_list:
            for lang, res in group.items():
                lang_totals[lang] += res.dimension_scores.total_score
                lang_counts[lang] += 1
                for dim in DIMENSION_NAMES:
                    dim_totals[dim][lang] += getattr(res.dimension_scores, dim)

        language_means: Dict[SupportedLanguage, float] = {}
        for lang in SupportedLanguage:
            if lang_counts[lang] > 0:
                language_means[lang] = round(lang_totals[lang] / lang_counts[lang], 2)
            else:
                language_means[lang] = 0.0

        # Overall Parity Gap: highest language mean - lowest language mean
        sorted_langs = sorted(language_means.items(), key=lambda kv: kv[1], reverse=True)
        highest_lang, max_mean = sorted_langs[0]
        lowest_lang, min_mean = sorted_langs[-1]
        overall_gap = round(max_mean - min_mean, 2)

        # Dimensional Gaps
        dimensional_gaps: Dict[str, DimensionalParityGap] = {}
        for dim in DIMENSION_NAMES:
            dim_means: Dict[SupportedLanguage, float] = {}
            for lang in SupportedLanguage:
                count = lang_counts[lang]
                dim_means[lang] = round(dim_totals[dim][lang] / count, 2) if count > 0 else 0.0

            sorted_dim = sorted(dim_means.items(), key=lambda kv: kv[1], reverse=True)
            d_high_lang, d_max = sorted_dim[0]
            d_low_lang, d_min = sorted_dim[-1]
            dimensional_gaps[dim] = DimensionalParityGap(
                dimension_name=dim,
                max_language=d_high_lang,
                min_language=d_low_lang,
                max_mean=d_max,
                min_mean=d_min,
                gap=round(d_max - d_min, 2),
            )

        return ParityGapReport(
            benchmark_version=benchmark_version,
            model_id=model_id,
            provider_name=provider_name,
            sample_count=len(evaluations),
            paired_task_count=len(paired_tasks),
            language_means=language_means,
            overall_parity_gap=overall_gap,
            highest_language=highest_lang,
            lowest_language=lowest_lang,
            dimensional_gaps=dimensional_gaps,
            is_provisional=is_provisional,
        )

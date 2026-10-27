"""Tests for Unicode Preservation, NFC Normalization, and Script Range Validation."""

import unicodedata
import pytest
from pydantic import ValidationError

from app.schemas.benchmark import (
    SupportedLanguage,
    SupportedScript,
    TaskVariantSchema,
)


def test_all_dataset_prompts_are_nfc_normalized(default_dataset):
    """Every prompt in the benchmark dataset must be strictly NFC normalized."""
    for task in default_dataset.tasks:
        for lang, variant in task.variants.items():
            assert unicodedata.is_normalized("NFC", variant.prompt), (
                f"Task {task.task_id} ({lang.value}) prompt is not NFC normalized: {variant.prompt}"
            )


def test_nfd_input_is_automatically_normalized_to_nfc():
    """NFD decomposed input must automatically be normalized to NFC by the schema."""
    # Compose an NFD string (character with combining mark)
    hindi_nfc = "कहाँ"
    hindi_nfd = unicodedata.normalize("NFD", hindi_nfc)
    assert unicodedata.is_normalized("NFD", hindi_nfd)

    variant = TaskVariantSchema(
        language=SupportedLanguage.HI,
        script=SupportedScript.DEVANAGARI,
        prompt=hindi_nfd + " मेरा डेटा जा रहा है?",
    )

    assert unicodedata.is_normalized("NFC", variant.prompt)


def test_script_mismatch_raises_validation_error():
    """Declaring a language with an incompatible script must raise ValidationError."""
    with pytest.raises(ValidationError) as exc_info:
        TaskVariantSchema(
            language=SupportedLanguage.HI,
            script=SupportedScript.LATIN,  # Hindi expects Devanagari
            prompt="This is Hindi written in English Latin script",
        )

    assert "expects script 'Devanagari'" in str(exc_info.value)


def test_script_character_range_enforcement():
    """Prompt must contain actual characters of the declared script."""
    # Punjabi prompt without any Gurmukhi letters (only Latin)
    with pytest.raises(ValidationError) as exc_info:
        TaskVariantSchema(
            language=SupportedLanguage.PA,
            script=SupportedScript.GURMUKHI,
            prompt="Siraf English script without Gurmukhi akhar",
        )

    assert "does not contain valid 'Gurmukhi' Unicode code points" in str(exc_info.value)

    # Odia prompt without any Odia letters
    with pytest.raises(ValidationError) as exc_info:
        TaskVariantSchema(
            language=SupportedLanguage.OR,
            script=SupportedScript.ODIA,
            prompt="Kevala English script without Odia akhara",
        )

    assert "does not contain valid 'Odia' Unicode code points" in str(exc_info.value)


def test_indic_unicode_code_point_ranges(default_dataset):
    """Verify that every task's variants contain code points within expected Unicode blocks."""
    for task in default_dataset.tasks:
        # Hindi: Devanagari block (\u0900 - \u097F)
        hi_prompt = task.variants[SupportedLanguage.HI].prompt
        has_devanagari = any("\u0900" <= char <= "\u097F" for char in hi_prompt)
        assert has_devanagari, f"Task {task.task_id} Hindi variant lacks Devanagari code points"

        # Punjabi: Gurmukhi block (\u0A00 - \u0A7F)
        pa_prompt = task.variants[SupportedLanguage.PA].prompt
        has_gurmukhi = any("\u0A00" <= char <= "\u0A7F" for char in pa_prompt)
        assert has_gurmukhi, f"Task {task.task_id} Punjabi variant lacks Gurmukhi code points"

        # Odia: Odia block (\u0B00 - \u0B7F)
        or_prompt = task.variants[SupportedLanguage.OR].prompt
        has_odia = any("\u0B00" <= char <= "\u0B7F" for char in or_prompt)
        assert has_odia, f"Task {task.task_id} Odia variant lacks Odia code points"

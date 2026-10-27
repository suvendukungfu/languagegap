"""Supported languages discovery endpoint."""

from typing import List
from fastapi import APIRouter
from app.schemas.api import LanguageInfo

router = APIRouter(tags=["languages"])

LANGUAGES_METADATA: List[LanguageInfo] = [
    LanguageInfo(
        code="en",
        name="English",
        script="Latin",
        direction="ltr",
        native_name="English",
        unicode_range="U+0020 - U+007E",
    ),
    LanguageInfo(
        code="hi",
        name="Hindi",
        script="Devanagari",
        direction="ltr",
        native_name="हिन्दी",
        unicode_range="U+0900 - U+097F",
    ),
    LanguageInfo(
        code="pa",
        name="Punjabi",
        script="Gurmukhi",
        direction="ltr",
        native_name="ਪੰਜਾਬੀ",
        unicode_range="U+0A00 - U+0A7F",
    ),
    LanguageInfo(
        code="or",
        name="Odia",
        script="Odia",
        direction="ltr",
        native_name="ଓଡ଼ିଆ",
        unicode_range="U+0B00 - U+0B7F",
    ),
]


@router.get("/languages", response_model=List[LanguageInfo])
def list_supported_languages() -> List[LanguageInfo]:
    """Return all initial supported languages and script metadata."""
    return LANGUAGES_METADATA

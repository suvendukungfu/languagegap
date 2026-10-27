"""Base Model Provider Interface and Exception Hierarchy."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from app.schemas.provider import GenerationResult, ProviderMetadata, SamplingParams


class ProviderError(Exception):
    """Base exception for all provider failures."""
    pass


class ProviderConfigurationError(ProviderError):
    """Raised when provider configuration is invalid or missing."""
    pass


class ProviderConnectionError(ProviderError):
    """Raised when connection to provider endpoint fails."""
    pass


class ProviderTimeoutError(ProviderError):
    """Raised when model inference times out."""
    pass


class ProviderAuthenticationError(ProviderError):
    """Raised when authentication (e.g. API key) is rejected."""
    pass


class ProviderResponseValidationError(ProviderError):
    """Raised when model returns empty or malformed output."""
    pass


class BaseModelProvider(ABC):
    """Abstract base class for all language model providers."""

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        sampling_params: Optional[SamplingParams] = None,
    ) -> GenerationResult:
        """Generate a completion for the provided prompt."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Verify provider availability and connectivity."""
        pass

    @abstractmethod
    def get_model_metadata(self) -> ProviderMetadata:
        """Return provider and model identification metadata."""
        pass

    def validate_response(self, response: GenerationResult) -> bool:
        """Default validation: ensure response text is non-empty and well-formed."""
        if not response or not isinstance(response, GenerationResult):
            raise ProviderResponseValidationError("Response object is None or not a GenerationResult instance")
        if not response.text or not response.text.strip():
            raise ProviderResponseValidationError("Generated response text is empty or blank")
        return True

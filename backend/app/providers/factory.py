"""Provider Factory for instantiating model providers."""

from __future__ import annotations

from typing import Optional

from app.core.config import settings
from app.providers.base import BaseModelProvider, ProviderConfigurationError
from app.providers.gemma import GemmaProvider
from app.providers.mock import MockGemmaProvider


def get_provider(provider_name: Optional[str] = None) -> BaseModelProvider:
    """Instantiate and return the configured model provider.

    Never silently falls back to Mock provider when a real provider is requested.
    """
    target = (provider_name or settings.gemma_provider).lower().strip()

    if target == "mock":
        return MockGemmaProvider(model_id=settings.gemma_model_id)

    if target in ("gemma", "openai", "vllm", "ollama"):
        if not settings.gemma_base_url:
            raise ProviderConfigurationError(
                f"Cannot initialize provider '{target}': GEMMA_BASE_URL is not set"
            )
        if not settings.gemma_model_id:
            raise ProviderConfigurationError(
                f"Cannot initialize provider '{target}': GEMMA_MODEL_ID is not set"
            )
        return GemmaProvider(
            base_url=settings.gemma_base_url,
            model_id=settings.gemma_model_id,
            api_key=settings.gemma_api_key,
            timeout_seconds=settings.evaluation_timeout_seconds,
            max_retries=settings.max_retries,
        )

    raise ProviderConfigurationError(
        f"Unsupported provider: '{target}'. Supported providers: 'mock', 'gemma', 'openai', 'vllm', 'ollama'"
    )

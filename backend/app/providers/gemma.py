"""Gemma 4 Provider Adapter for OpenAI-Compatible Inference Endpoints.

Interacts with standard open-weight inference servers (vLLM, Ollama,
llama.cpp, HuggingFace TGI) hosting Gemma 4 models.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, Dict, Optional
import httpx

from app.core.config import settings
from app.providers.base import (
    BaseModelProvider,
    ProviderAuthenticationError,
    ProviderConfigurationError,
    ProviderConnectionError,
    ProviderError,
    ProviderResponseValidationError,
    ProviderTimeoutError,
)
from app.schemas.provider import (
    GenerationResult,
    ProviderMetadata,
    SamplingParams,
    TokenUsage,
)


class GemmaProvider(BaseModelProvider):
    """Inference provider for Gemma 4 via standard inference server endpoints."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        model_id: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout_seconds: Optional[float] = None,
        max_retries: Optional[int] = None,
    ):
        self.base_url = (base_url or settings.gemma_base_url).rstrip("/")
        self.model_id = model_id or settings.gemma_model_id
        self.api_key = api_key if api_key is not None else settings.gemma_api_key
        self.timeout_seconds = timeout_seconds if timeout_seconds is not None else settings.evaluation_timeout_seconds
        self.max_retries = max_retries if max_retries is not None else settings.max_retries

        if not self.base_url:
            raise ProviderConfigurationError("GEMMA_BASE_URL must not be empty")
        if not self.model_id:
            raise ProviderConfigurationError("GEMMA_MODEL_ID must not be empty")

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "LanguageGap-Evaluation/1.0",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            if "googleapis.com" in self.base_url:
                headers["x-goog-api-key"] = self.api_key
        return headers

    def get_model_metadata(self) -> ProviderMetadata:
        """Return runtime provider metadata."""
        return ProviderMetadata(
            provider_name="gemma",
            model_id=self.model_id,
            base_url=self.base_url,
            is_mock=False,
        )

    async def health_check(self) -> bool:
        """Check if the configured endpoint is reachable and responsive."""
        headers = self._get_headers()
        url = f"{self.base_url}/models"
        try:
            async with httpx.AsyncClient(timeout=min(self.timeout_seconds, 10.0)) as client:
                response = await client.get(url, headers=headers)
                return response.status_code == 200
        except Exception:
            return False

    async def generate(
        self,
        prompt: str,
        sampling_params: Optional[SamplingParams] = None,
    ) -> GenerationResult:
        """Execute text completion with bounded retries and latency tracking."""
        if not prompt or not prompt.strip():
            raise ProviderResponseValidationError("Prompt must not be empty")

        params = sampling_params or SamplingParams()
        payload = {
            "model": self.model_id,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": params.temperature,
            "top_p": params.top_p,
            "max_tokens": params.max_tokens,
        }
        if params.stop:
            payload["stop"] = params.stop

        headers = self._get_headers()
        url = f"{self.base_url}/chat/completions"

        last_exception: Optional[Exception] = None

        for attempt in range(self.max_retries + 1):
            start_time = time.perf_counter()
            try:
                async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                    resp = await client.post(url, json=payload, headers=headers)

                elapsed_ms = (time.perf_counter() - start_time) * 1000.0

                if resp.status_code in (401, 403):
                    raise ProviderAuthenticationError(
                        f"Authentication failed ({resp.status_code}): {resp.text}"
                    )

                if resp.status_code in (429, 500, 502, 503, 504):
                    if attempt < self.max_retries:
                        backoff = min(0.2 * (2 ** attempt), 2.0)
                        await asyncio.sleep(backoff)
                        continue
                    raise ProviderError(
                        f"Provider HTTP error {resp.status_code} after {self.max_retries} retries: {resp.text}"
                    )

                if resp.status_code != 200:
                    raise ProviderError(f"Unexpected provider status {resp.status_code}: {resp.text}")

                # Parse JSON
                try:
                    data = resp.json()
                except Exception as e:
                    raise ProviderResponseValidationError(f"Invalid JSON returned by provider: {e}")

                choices = data.get("choices")
                if not choices or not isinstance(choices, list) or len(choices) == 0:
                    raise ProviderResponseValidationError("Provider response does not contain any choices")

                first_choice = choices[0]
                message = first_choice.get("message", {})
                content = message.get("content") or first_choice.get("text") or ""
                finish_reason = first_choice.get("finish_reason", "stop")

                if not content.strip():
                    raise ProviderResponseValidationError("Provider returned empty completion content")

                # Parse token usage
                usage_data = data.get("usage", {})
                usage = TokenUsage(
                    prompt_tokens=usage_data.get("prompt_tokens", 0),
                    completion_tokens=usage_data.get("completion_tokens", 0),
                    total_tokens=usage_data.get("total_tokens", 0),
                )

                result = GenerationResult(
                    text=content.strip(),
                    finish_reason=finish_reason,
                    latency_ms=round(elapsed_ms, 2),
                    usage=usage,
                    provider_metadata=self.get_model_metadata(),
                    raw_response=data,
                )
                self.validate_response(result)
                return result

            except httpx.TimeoutException as e:
                last_exception = ProviderTimeoutError(f"Request timed out after {self.timeout_seconds}s: {e}")
                if attempt < self.max_retries:
                    await asyncio.sleep(min(0.2 * (2 ** attempt), 2.0))
                    continue
            except (httpx.ConnectError, httpx.NetworkError) as e:
                last_exception = ProviderConnectionError(f"Failed to connect to {self.base_url}: {e}")
                if attempt < self.max_retries:
                    await asyncio.sleep(min(0.2 * (2 ** attempt), 2.0))
                    continue
            except (ProviderAuthenticationError, ProviderResponseValidationError):
                raise
            except Exception as e:
                last_exception = ProviderError(f"Unexpected error: {e}")
                if attempt < self.max_retries:
                    await asyncio.sleep(min(0.2 * (2 ** attempt), 2.0))
                    continue

        if last_exception:
            raise last_exception
        raise ProviderError("Generation failed with unknown error")

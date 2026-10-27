"""Tests for Provider Abstraction, Gemma 4 Provider Adapter, and Mock Provider.

All unit tests in this module use deterministic mocks and NEVER make real
network requests or incur API costs.
"""

from unittest.mock import AsyncMock, patch
import httpx
import pytest

from app.providers.base import (
    BaseModelProvider,
    ProviderAuthenticationError,
    ProviderConfigurationError,
    ProviderConnectionError,
    ProviderError,
    ProviderResponseValidationError,
    ProviderTimeoutError,
)
from app.providers.factory import get_provider
from app.providers.gemma import GemmaProvider
from app.providers.mock import MockGemmaProvider
from app.schemas.provider import (
    GenerationResult,
    ProviderMetadata,
    SamplingParams,
    TokenUsage,
)


# ------------------------------------------------------------------------------
# MockGemmaProvider Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_mock_provider_lifecycle():
    """Verify mock provider generates valid responses without external dependencies."""
    provider = MockGemmaProvider(model_id="gemma-4-it-mock")
    metadata = provider.get_model_metadata()

    assert metadata.provider_name == "mock"
    assert metadata.is_mock is True
    assert await provider.health_check() is True

    result = await provider.generate("How to secure my account?")
    assert isinstance(result, GenerationResult)
    assert len(result.text) > 20
    assert result.latency_ms > 0
    assert result.usage.total_tokens > 0
    assert result.finish_reason == "stop"


@pytest.mark.asyncio
async def test_mock_provider_multilingual_responses():
    """Verify mock provider delivers valid responses for Indic scripts."""
    provider = MockGemmaProvider()

    # Hindi prompt
    hi_res = await provider.generate("मैं अपने ऑनलाइन खाते को कैसे सुरक्षित रखूँ?")
    assert any("\u0900" <= c <= "\u097F" for c in hi_res.text)

    # Punjabi prompt
    pa_res = await provider.generate("ਮੈਂ ਆਪਣੇ ਔਨਲਾਈਨ ਖਾਤੇ ਨੂੰ ਕਿਵੇਂ ਸੁਰੱਖਿਅਤ ਰੱਖਾਂ?")
    assert any("\u0A00" <= c <= "\u0A7F" for c in pa_res.text)

    # Odia prompt
    or_res = await provider.generate("ମୋର ଅନଲାଇନ୍ ଆକାଉଣ୍ଟକୁ କିପରି ସୁରକ୍ଷିତ ରଖିବି?")
    assert any("\u0B00" <= c <= "\u0B7F" for c in or_res.text)


@pytest.mark.asyncio
async def test_mock_provider_empty_prompt_raises():
    """Empty or whitespace prompt must raise ProviderResponseValidationError."""
    provider = MockGemmaProvider()
    with pytest.raises(ProviderResponseValidationError):
        await provider.generate("   ")


# ------------------------------------------------------------------------------
# GemmaProvider (Mocked Network) Tests
# ------------------------------------------------------------------------------

@pytest.fixture
def mock_gemma_provider():
    return GemmaProvider(
        base_url="https://api.example.com/v1",
        model_id="gemma-4-it",
        api_key="secret-test-key",
        timeout_seconds=5.0,
        max_retries=2,
    )


def test_gemma_provider_metadata(mock_gemma_provider):
    """Verify metadata reflects real provider configuration and is_mock=False."""
    meta = mock_gemma_provider.get_model_metadata()
    assert meta.provider_name == "gemma"
    assert meta.model_id == "gemma-4-it"
    assert meta.base_url == "https://api.example.com/v1"
    assert meta.is_mock is False


@pytest.mark.asyncio
async def test_gemma_provider_successful_generation(mock_gemma_provider):
    """Verify happy-path parsing of OpenAI-compatible completion response."""
    mock_payload = {
        "id": "chatcmpl-123",
        "object": "chat.completion",
        "created": 1700000000,
        "model": "gemma-4-it",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "Two-factor authentication adds an extra layer of defense beyond passwords.",
                },
                "finish_reason": "stop",
            }
        ],
        "usage": {
            "prompt_tokens": 12,
            "completion_tokens": 14,
            "total_tokens": 26,
        },
    }

    mock_resp = httpx.Response(200, json=mock_payload)

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        sampling = SamplingParams(temperature=0.3, top_p=0.9, max_tokens=256)
        result = await mock_gemma_provider.generate(
            prompt="What is 2FA?",
            sampling_params=sampling,
        )

        assert mock_post.called
        call_kwargs = mock_post.call_args.kwargs
        assert call_kwargs["json"]["model"] == "gemma-4-it"
        assert call_kwargs["json"]["temperature"] == 0.3
        assert call_kwargs["json"]["top_p"] == 0.9
        assert call_kwargs["json"]["max_tokens"] == 256
        assert call_kwargs["headers"]["Authorization"] == "Bearer secret-test-key"

        assert result.text == "Two-factor authentication adds an extra layer of defense beyond passwords."
        assert result.finish_reason == "stop"
        assert result.usage.total_tokens == 26
        assert result.provider_metadata.is_mock is False


@pytest.mark.asyncio
async def test_gemma_provider_auth_failure_raises_immediately(mock_gemma_provider):
    """401/403 authentication error must raise immediately without retrying."""
    mock_resp = httpx.Response(401, text="Unauthorized: Invalid API key")

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        with pytest.raises(ProviderAuthenticationError) as exc_info:
            await mock_gemma_provider.generate("Test prompt")

        assert "Authentication failed (401)" in str(exc_info.value)
        # Verify it did not retry on auth failure
        assert mock_post.call_count == 1


@pytest.mark.asyncio
async def test_gemma_provider_transient_error_bounded_retries(mock_gemma_provider):
    """503 Service Unavailable triggers retries up to max_retries."""
    mock_resp_503 = httpx.Response(503, text="Service Unavailable")
    mock_resp_200 = httpx.Response(
        200,
        json={
            "choices": [{"message": {"content": "Success after retry"}}],
            "usage": {"total_tokens": 10},
        },
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        # First call fails 503, second succeeds 200
        mock_post.side_effect = [mock_resp_503, mock_resp_200]

        result = await mock_gemma_provider.generate("Prompt")
        assert result.text == "Success after retry"
        assert mock_post.call_count == 2


@pytest.mark.asyncio
async def test_gemma_provider_exhausted_retries_raises(mock_gemma_provider):
    """When retries are exhausted on 500 errors, ProviderError is raised."""
    mock_resp_500 = httpx.Response(500, text="Internal Server Error")

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp_500

        with pytest.raises(ProviderError) as exc_info:
            await mock_gemma_provider.generate("Prompt")

        assert "Provider HTTP error 500" in str(exc_info.value)
        # initial attempt + 2 retries = 3 calls
        assert mock_post.call_count == 3


@pytest.mark.asyncio
async def test_gemma_provider_malformed_response_raises(mock_gemma_provider):
    """Empty choices or missing content raises ProviderResponseValidationError."""
    mock_resp_empty_choices = httpx.Response(200, json={"choices": []})

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp_empty_choices

        with pytest.raises(ProviderResponseValidationError) as exc_info:
            await mock_gemma_provider.generate("Prompt")

        assert "does not contain any choices" in str(exc_info.value)


@pytest.mark.asyncio
async def test_gemma_provider_health_check(mock_gemma_provider):
    """Health check returns True on 200 and False on network failure."""
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = httpx.Response(200, json={"data": [{"id": "gemma-4-it"}]})
        assert await mock_gemma_provider.health_check() is True

        mock_get.side_effect = httpx.ConnectError("Connection refused")
        assert await mock_gemma_provider.health_check() is False


# ------------------------------------------------------------------------------
# Provider Factory Tests
# ------------------------------------------------------------------------------

def test_factory_returns_mock_provider():
    provider = get_provider("mock")
    assert isinstance(provider, MockGemmaProvider)


def test_factory_returns_gemma_provider():
    provider = get_provider("gemma")
    assert isinstance(provider, GemmaProvider)


def test_factory_unknown_provider_raises():
    with pytest.raises(ProviderConfigurationError):
        get_provider("unsupported_super_ai")

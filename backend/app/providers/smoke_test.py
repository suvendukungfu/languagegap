"""Smoke-test CLI tool for verifying real Gemma 4 inference endpoints.

Explicitly validates real provider connectivity, health checks, and test
inference. Fails with diagnostic guidance rather than silently falling back
to mock output.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

# Ensure backend root is on sys.path for standalone CLI usage
BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings
from app.providers.base import BaseModelProvider, ProviderConfigurationError
from app.providers.factory import get_provider
from app.providers.gemma import GemmaProvider
from app.schemas.provider import SamplingParams


async def run_smoke_test(
    provider_name: str,
    base_url: str | None = None,
    model_id: str | None = None,
    api_key: str | None = None,
    prompt: str = "Explain what two-factor authentication (2FA) is in one short paragraph.",
) -> int:
    print("=" * 70)
    print(" LanguageGap — Model Provider Smoke Test")
    print("=" * 70)

    target_provider = provider_name.lower().strip()
    print(f"Target Provider:      {target_provider}")

    if target_provider == "mock":
        print("\n[WARNING] Testing with 'mock' provider.")
        print("To test a live Gemma 4 inference endpoint, pass '--provider gemma'")
        print("or set GEMMA_PROVIDER=gemma in your environment / .env file.")
        provider = get_provider("mock")
    else:
        resolved_url = base_url or settings.gemma_base_url
        resolved_model = model_id or settings.gemma_model_id
        resolved_key = api_key if api_key is not None else settings.gemma_api_key

        print(f"Inference Endpoint:   {resolved_url}")
        print(f"Model Identifier:     {resolved_model}")
        print(f"API Key Present:      {'Yes (masked)' if resolved_key else 'No (None)'}")

        if not resolved_url or resolved_url.strip() == "":
            print("\n[ERROR] Missing Configuration: GEMMA_BASE_URL is not set.")
            print("Please set GEMMA_BASE_URL in .env or pass --base-url <url>.")
            return 1

        if not resolved_model or resolved_model.strip() == "":
            print("\n[ERROR] Missing Configuration: GEMMA_MODEL_ID is not set.")
            print("Please set GEMMA_MODEL_ID in .env or pass --model-id <id>.")
            return 1

        try:
            provider = GemmaProvider(
                base_url=resolved_url,
                model_id=resolved_model,
                api_key=resolved_key,
                timeout_seconds=settings.evaluation_timeout_seconds,
                max_retries=settings.max_retries,
            )
        except ProviderConfigurationError as e:
            print(f"\n[ERROR] Configuration failed: {e}")
            return 1

    metadata = provider.get_model_metadata()
    print(f"Initialized Metadata: {metadata.provider_name} / {metadata.model_id} (is_mock={metadata.is_mock})")

    # Step 1: Health check
    print("\n--- 1. Health Check ---")
    try:
        is_healthy = await provider.health_check()
        if is_healthy:
            print(f"[PASSED] Health check succeeded at {metadata.base_url}")
        else:
            print(f"[FAILED] Health check probe failed at {metadata.base_url}")
            if not metadata.is_mock:
                print("Check whether your inference server (vLLM, Ollama, etc.) is running and accessible.")
                return 1
    except Exception as e:
        print(f"[FAILED] Health check error: {e}")
        return 1

    # Step 2: Generation probe
    print("\n--- 2. Generation Probe ---")
    print(f"Prompt: \"{prompt}\"")
    sampling = SamplingParams(temperature=0.1, max_tokens=150)
    try:
        result = await provider.generate(prompt=prompt, sampling_params=sampling)
        print(f"[SUCCESS] Completion received in {result.latency_ms:.2f} ms")
        print(f"Tokens: Prompt={result.usage.prompt_tokens}, Completion={result.usage.completion_tokens}, Total={result.usage.total_tokens}")
        print(f"Finish Reason: {result.finish_reason}")
        print("-" * 50)
        print(f"Response:\n{result.text}")
        print("-" * 50)
        return 0
    except Exception as e:
        print(f"[ERROR] Generation probe failed: {e}")
        return 1


def main():
    parser = argparse.ArgumentParser(description="LanguageGap Provider Smoke Test")
    parser.add_argument(
        "--provider",
        default=settings.gemma_provider,
        help="Provider to test: 'mock', 'gemma', 'openai', 'vllm', 'ollama' (default from config)",
    )
    parser.add_argument("--base-url", default=None, help="Inference server base URL")
    parser.add_argument("--model-id", default=None, help="Model identifier (e.g. gemma-4-it)")
    parser.add_argument("--api-key", default=None, help="Inference API Key")
    parser.add_argument("--prompt", default="Explain what two-factor authentication (2FA) is in one short paragraph.")

    args = parser.parse_args()
    code = asyncio.run(
        run_smoke_test(
            provider_name=args.provider,
            base_url=args.base_url,
            model_id=args.model_id,
            api_key=args.api_key,
            prompt=args.prompt,
        )
    )
    sys.exit(code)


if __name__ == "__main__":
    main()

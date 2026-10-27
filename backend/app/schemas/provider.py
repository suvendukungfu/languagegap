"""Provider Inference and Generation Data Schemas."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SamplingParams(BaseModel):
    """Generation sampling parameters applied identically across languages."""
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    top_p: float = Field(default=0.95, ge=0.0, le=1.0)
    max_tokens: int = Field(default=1024, ge=1, le=8192)
    stop: Optional[List[str]] = Field(default=None)


class TokenUsage(BaseModel):
    """Token accounting metadata for an inference call."""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class ProviderMetadata(BaseModel):
    """Metadata identifying the inference provider and model configuration."""
    provider_name: str
    model_id: str
    model_revision: Optional[str] = None
    quantization: Optional[str] = None
    base_url: Optional[str] = None
    is_mock: bool = False


class GenerationResult(BaseModel):
    """Structured response from a model provider."""
    text: str = Field(..., description="Generated completion text")
    finish_reason: Optional[str] = Field(default="stop", description="Reason generation finished, e.g. stop, length")
    latency_ms: float = Field(..., ge=0.0, description="End-to-end request latency in milliseconds")
    usage: TokenUsage = Field(default_factory=TokenUsage)
    provider_metadata: ProviderMetadata
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    raw_response: Optional[Dict[str, Any]] = Field(default=None, description="Optional raw payload for debugging")

"""Application Settings and Environment Configuration."""

from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel, Field


def _load_env_file() -> None:
    """Manually parse .env file if present, populating os.environ without overriding set vars."""
    candidates = [
        Path.cwd() / ".env",
        Path.cwd() / "backend" / ".env",
        Path(__file__).resolve().parent.parent.parent / ".env",
        Path(__file__).resolve().parent.parent.parent.parent / ".env",
    ]
    for env_path in candidates:
        if env_path.is_file():
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k not in os.environ:
                                os.environ[k] = v
                break
            except Exception:
                pass


_load_env_file()


class Settings(BaseModel):
    """Central configuration for LanguageGap service."""
    host: str = Field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))
    port: int = Field(default_factory=lambda: int(os.getenv("PORT", "8000")))
    environment: str = Field(default_factory=lambda: os.getenv("ENVIRONMENT", "development"))
    log_level: str = Field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))
    database_url: str = Field(default_factory=lambda: os.getenv("DATABASE_URL", "sqlite:///./languagegap.db"))
    cors_origins: List[str] = Field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
            if origin.strip()
        ]
    )

    # Gemma Provider Settings
    gemma_provider: str = Field(default_factory=lambda: os.getenv("GEMMA_PROVIDER", "mock").lower())
    gemma_base_url: str = Field(default_factory=lambda: os.getenv("GEMMA_BASE_URL", "http://localhost:11434/v1"))
    gemma_api_key: Optional[str] = Field(default_factory=lambda: os.getenv("GEMMA_API_KEY"))
    gemma_model_id: str = Field(default_factory=lambda: os.getenv("GEMMA_MODEL_ID", "gemma-4-it"))

    # Sampling Parameters (applied identically across languages)
    sampling_temperature: float = Field(default_factory=lambda: float(os.getenv("SAMPLING_TEMPERATURE", "0.2")))
    sampling_top_p: float = Field(default_factory=lambda: float(os.getenv("SAMPLING_TOP_P", "0.95")))
    max_generation_tokens: int = Field(default_factory=lambda: int(os.getenv("MAX_GENERATION_TOKENS", "1024")))

    # Runtime Execution Settings
    evaluation_timeout_seconds: float = Field(
        default_factory=lambda: float(os.getenv("EVALUATION_TIMEOUT_SECONDS", "60.0"))
    )
    max_retries: int = Field(default_factory=lambda: int(os.getenv("MAX_RETRIES", "3")))
    benchmark_version: str = Field(default_factory=lambda: os.getenv("BENCHMARK_VERSION", "1.0.0"))


settings = Settings()

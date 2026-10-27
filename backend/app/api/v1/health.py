"""Health check endpoint."""

from fastapi import APIRouter
from app.core.config import settings
from app.schemas.api import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Service liveness and health probe."""
    return HealthResponse(
        status="ok",
        environment=settings.environment,
        version="1.0.0",
        provider=settings.gemma_provider,
        database="sqlite",
    )

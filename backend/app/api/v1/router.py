"""API v1 Aggregator Router."""

from fastapi import APIRouter
from app.api.v1.benchmarks import router as benchmarks_router
from app.api.v1.evaluations import router as evaluations_router
from app.api.v1.health import router as health_router
from app.api.v1.languages import router as languages_router
from app.api.v1.reviews import router as reviews_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(languages_router)
api_router.include_router(benchmarks_router)
api_router.include_router(evaluations_router)
api_router.include_router(reviews_router)

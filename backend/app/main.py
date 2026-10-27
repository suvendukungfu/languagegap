"""Main FastAPI Application Entrypoint."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context: initialize database on startup."""
    init_db()
    yield


app = FastAPI(
    title="LanguageGap API",
    description="Multilingual AI response-quality and language-parity evaluation platform powered by Gemma 4.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount versioned API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["root"])
def root():
    return {
        "service": "LanguageGap",
        "tagline": "Same question. Different languages. Equal opportunity to understand.",
        "version": "1.0.0",
        "docs_url": "/docs",
        "api_v1": "/api/v1",
    }

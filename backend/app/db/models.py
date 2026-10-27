"""SQLAlchemy Data Models for Persistence."""

from __future__ import annotations

import json
from datetime import datetime, timezone
import uuid
from sqlalchemy import Boolean, Column, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class EvaluationRunModel(Base):
    """Persisted record of an evaluation benchmark run."""
    __tablename__ = "evaluation_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String(64), nullable=False)
    benchmark_version = Column(String(32), nullable=False)
    model_id = Column(String(128), nullable=False)
    provider_name = Column(String(64), nullable=False)
    status = Column(String(32), nullable=False, default="pending")  # pending, running, completed, failed
    error_message = Column(Text, nullable=True)
    sampling_params = Column(Text, nullable=False, default="{}")  # JSON encoded
    created_at = Column(String(64), default=lambda: datetime.now(timezone.utc).isoformat())
    completed_at = Column(String(64), nullable=True)

    # Relationships
    responses = relationship(
        "TaskResponseModel",
        back_populates="evaluation_run",
        cascade="all, delete-orphan",
        order_by="TaskResponseModel.created_at",
    )


class TaskResponseModel(Base):
    """Persisted record of an individual language response and its evaluation scores."""
    __tablename__ = "task_responses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id = Column(String(36), ForeignKey("evaluation_runs.id"), nullable=False, index=True)
    task_id = Column(String(64), nullable=False, index=True)
    language = Column(String(8), nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    response_text = Column(Text, nullable=False)
    latency_ms = Column(Float, nullable=False, default=0.0)
    token_usage = Column(Text, nullable=False, default="{}")  # JSON
    dimension_scores = Column(Text, nullable=False, default="{}")  # JSON of DimensionScores
    fact_coverage = Column(Text, nullable=False, default="[]")  # JSON list
    unsupported_claims = Column(Text, nullable=False, default="[]")  # JSON list
    is_provisional = Column(Boolean, nullable=False, default=True)
    evaluation_method = Column(String(64), nullable=False, default="automated_provisional")
    evidence_notes = Column(Text, nullable=True)
    created_at = Column(String(64), default=lambda: datetime.now(timezone.utc).isoformat())

    # Relationships
    evaluation_run = relationship("EvaluationRunModel", back_populates="responses")
    reviews = relationship(
        "HumanReviewModel",
        back_populates="task_response",
        cascade="all, delete-orphan",
        order_by="HumanReviewModel.reviewed_at.desc()",
    )


class HumanReviewModel(Base):
    """Persisted record of human evaluator audits and score corrections."""
    __tablename__ = "human_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    response_id = Column(String(36), ForeignKey("task_responses.id"), nullable=False, index=True)
    reviewer_id = Column(String(128), nullable=False)
    reviewed_at = Column(String(64), default=lambda: datetime.now(timezone.utc).isoformat())
    original_scores = Column(Text, nullable=False)  # JSON
    overridden_scores = Column(Text, nullable=False)  # JSON
    reviewer_notes = Column(Text, nullable=False)

    # Relationships
    task_response = relationship("TaskResponseModel", back_populates="reviews")

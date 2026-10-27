import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import { ReproducibilityPassportCard } from "@/components/ReproducibilityPassportCard";
import { EvaluationPassportResponse } from "@/types";

const mockPassport: EvaluationPassportResponse = {
  evaluation_run_id: "test-run-123456",
  benchmark_id: "digital_literacy",
  benchmark_version: "1.0.0",
  benchmark_sha256: "8072392cae9a22a02e4de196e426b518baf89effccea16bf7283c4c1c2fc1377",
  provider_id: "gemma",
  actual_model_id: "google/gemma-4-31b-it",
  is_mock_provider: false,
  evaluation_timestamp: "2026-10-27T08:00:00Z",
  completed_at: "2026-10-27T08:05:00Z",
  execution_status: "completed",
  language_set: ["en", "hi", "or", "pa"],
  task_count: 6,
  sample_count: 24,
  scoring_configuration: { max_score: 14 },
  evaluator_version: "1.0.0",
  language_wise_scores: {
    en: { total_score: 13.5 },
    hi: { total_score: 11.2 },
    pa: { total_score: 9.8 },
    or: { total_score: 9.1 },
  },
  language_means: { en: 13.5, hi: 11.2, pa: 9.8, or: 9.1 },
  dimension_wise_scores: {
    factual_correctness: 3.5,
    completeness: 3.2,
  },
  parity_gap: 4.4,
  highest_language: "en",
  lowest_language: "or",
  human_review_status: "partially_reviewed",
  human_review_count: 2,
  reviewer_overrides: [],
  benchmark_integrity: {
    valid: true,
    errors: [],
    warnings: [],
    benchmark_id: "digital_literacy",
    benchmark_version: "1.0.0",
    task_count: 6,
    language_coverage: { en: 6, hi: 6, pa: 6, or: 6 },
    expected_languages: ["en", "hi", "pa", "or"],
    benchmark_sha256: "8072392cae9a22a02e4de196e426b518baf89effccea16bf7283c4c1c2fc1377",
    verified_at: "2026-10-27T08:00:00Z",
  },
  exported_at: "2026-10-27T08:10:00Z",
};

describe("ReproducibilityPassportCard Component", () => {
  it("renders benchmark fingerprint, model ID, and integrity status", () => {
    render(<ReproducibilityPassportCard passport={mockPassport} />);
    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
    expect(screen.getByText("google/gemma-4-31b-it")).toBeInTheDocument();
    expect(screen.getByText("PASSED (Unicode NFC)")).toBeInTheDocument();
  });

  it("renders parity gap, language set, and review status", () => {
    render(<ReproducibilityPassportCard passport={mockPassport} />);
    expect(screen.getByText(/Δ 4.400/)).toBeInTheDocument();
    expect(screen.getByText("en • hi • or • pa")).toBeInTheDocument();
    expect(screen.getByText("partially reviewed")).toBeInTheDocument();
  });

  it("renders download passport button with accessible label", () => {
    render(<ReproducibilityPassportCard passport={mockPassport} />);
    const downloadBtn = screen.getByRole("button", { name: /Download Passport JSON/i });
    expect(downloadBtn).toBeInTheDocument();
  });
});

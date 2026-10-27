import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import { ParityCard } from "@/components/ParityCard";
import { ParityGapReport } from "@/types";

const mockReport: ParityGapReport = {
  benchmark_version: "1.0.0",
  model_id: "gemma-4-it",
  provider_name: "gemma",
  sample_count: 24,
  paired_task_count: 6,
  language_means: {
    en: 13.5,
    hi: 11.0,
    pa: 9.8,
    or: 9.2,
  },
  overall_parity_gap: 4.3,
  highest_language: "en",
  lowest_language: "or",
  dimensional_gaps: {
    factual_correctness: {
      dimension_name: "factual_correctness",
      max_language: "en",
      min_language: "or",
      max_mean: 3.8,
      min_mean: 2.2,
      gap: 1.6,
    },
  },
  is_provisional: true,
  generated_at: "2026-10-27T00:00:00Z",
};

describe("ParityCard Component", () => {
  it("renders the calculated parity gap value and unit", () => {
    render(<ParityCard report={mockReport} />);
    expect(screen.getByText("4.30")).toBeInTheDocument();
    expect(screen.getByText("/ 14.0 pts")).toBeInTheDocument();
  });

  it("identifies highest and lowest languages correctly", () => {
    render(<ParityCard report={mockReport} />);
    expect(screen.getByText(/High: English \(en\)/)).toBeInTheDocument();
    expect(screen.getByText(/Low: Odia \(or\)/)).toBeInTheDocument();
  });

  it("displays sample audit count and model information", () => {
    render(<ParityCard report={mockReport} />);
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText(/matched tasks/)).toBeInTheDocument();
    expect(screen.getByText("gemma-4-it")).toBeInTheDocument();
  });
});

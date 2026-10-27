import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import { LanguageComparisonMatrix } from "@/components/LanguageComparisonMatrix";
import { TaskResponseDetail } from "@/types";

const mockResponses: TaskResponseDetail[] = [
  {
    id: "resp-en",
    task_id: "DL-01-SEC-2FA",
    language: "en",
    prompt: "How can I secure my accounts with 2FA?",
    response_text: "2FA adds critical defense beyond passwords.",
    latency_ms: 100,
    dimension_scores: {
      factual_correctness: 4,
      completeness: 4,
      instruction_adherence: 2,
      language_naturalness: 2,
      safety_appropriateness: 2,
      total_score: 14,
    },
    is_provisional: true,
    evaluation_method: "automated_provisional",
    fact_coverage: [
      { fact: "2FA adds secondary defense", covered: true, evidence: "2FA adds critical defense", confidence: 1.0 },
      { fact: "Authenticator apps are safer than SMS", covered: true, evidence: null, confidence: 1.0 },
    ],
    unsupported_claims: [],
  },
  {
    id: "resp-hi",
    task_id: "DL-01-SEC-2FA",
    language: "hi",
    prompt: "मैं 2FA से अपने खाते कैसे सुरक्षित करूँ?",
    response_text: "टू-फैक्टर ऑथेंटिकेशन आपके खातों को सुरक्षित करता है।",
    latency_ms: 110,
    dimension_scores: {
      factual_correctness: 3,
      completeness: 3,
      instruction_adherence: 2,
      language_naturalness: 2,
      safety_appropriateness: 2,
      total_score: 12,
    },
    is_provisional: true,
    evaluation_method: "automated_provisional",
    fact_coverage: [
      { fact: "2FA adds secondary defense", covered: true, evidence: null, confidence: 1.0 },
      { fact: "Authenticator apps are safer than SMS", covered: false, evidence: null, confidence: 0.8 },
    ],
    unsupported_claims: [],
  },
];

describe("LanguageComparisonMatrix Component", () => {
  it("renders language cards and total scores", () => {
    render(<LanguageComparisonMatrix responses={mockResponses} />);
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Hindi")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("indicates missing languages with a dashed placeholder", () => {
    render(<LanguageComparisonMatrix responses={mockResponses} />);
    // Punjabi and Odia are missing in this mock
    expect(screen.getAllByText(/No response recorded/i)).toHaveLength(2);
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { HumanReviewModal } from "@/components/HumanReviewModal";
import { TaskResponseDetail } from "@/types";

const mockResponse: TaskResponseDetail = {
  id: "resp-test-01",
  task_id: "DL-01-SEC-2FA",
  language: "hi",
  prompt: "मैं 2FA से अपने खाते कैसे सुरक्षित करूँ?",
  response_text: "टू-फैक्टर ऑथेंटिकेशन सुरक्षा बढ़ाता है।",
  latency_ms: 120,
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
  fact_coverage: [],
  unsupported_claims: [],
};

describe("HumanReviewModal Accessibility & Interactions", () => {
  it("renders with correct ARIA dialog semantics and accessible slider names", () => {
    const handleClose = vi.fn();
    const handleSubmitted = vi.fn();

    render(
      <HumanReviewModal
        response={mockResponse}
        isOpen={true}
        onClose={handleClose}
        onReviewSubmitted={handleSubmitted}
      />
    );

    // Verify dialog role and aria attributes
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "review-modal-title");

    // Verify close button accessible name
    expect(screen.getByRole("button", { name: /close review modal/i })).toBeInTheDocument();

    // Verify accessible names on all 5 rubric sliders
    expect(screen.getByRole("slider", { name: /factual correctness score/i })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /completeness score/i })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /instruction adherence score/i })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /language naturalness and script quality score/i })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /safety appropriateness score/i })).toBeInTheDocument();
  });

  it("closes when the Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(
      <HumanReviewModal
        response={mockResponse}
        isOpen={true}
        onClose={handleClose}
        onReviewSubmitted={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

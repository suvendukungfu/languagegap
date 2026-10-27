"use client";

import React, { useState } from "react";
import { X, AlertCircle, ShieldCheck } from "lucide-react";
import { DimensionScores, TaskResponseDetail } from "@/types";
import { submitHumanReview } from "@/lib/api";

interface HumanReviewModalProps {
  response: TaskResponseDetail;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: (responseId: string, updatedScores: DimensionScores) => void;
}

export function HumanReviewModal({
  response,
  isOpen,
  onClose,
  onReviewSubmitted,
}: HumanReviewModalProps) {
  const [reviewerId, setReviewerId] = useState<string>("auditor_linguist");
  const [factual, setFactual] = useState<number>(response.dimension_scores.factual_correctness);
  const [completeness, setCompleteness] = useState<number>(response.dimension_scores.completeness);
  const [instruction, setInstruction] = useState<number>(response.dimension_scores.instruction_adherence);
  const [naturalness, setNaturalness] = useState<number>(response.dimension_scores.language_naturalness);
  const [safety, setSafety] = useState<number>(response.dimension_scores.safety_appropriateness);
  const [reviewerNotes, setReviewerNotes] = useState<string>(
    `Audited response in ${response.language.toUpperCase()}. Fact coverage and script naturalness verified against canonical references.`
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTotal = factual + completeness + instruction + naturalness + safety;
  const originalTotal = response.dimension_scores.total_score;
  const delta = currentTotal - originalTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerId.trim()) {
      setErrorMsg("Reviewer ID or linguistic auditor credential is required.");
      return;
    }
    if (reviewerNotes.trim().length < 5) {
      setErrorMsg("Please provide substantive audit rationale notes (min 5 characters).");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await submitHumanReview(response.id, {
        reviewer_id: reviewerId.trim(),
        score_overrides: {
          factual_correctness: factual,
          completeness: completeness,
          instruction_adherence: instruction,
          language_naturalness: naturalness,
          safety_appropriateness: safety,
        },
        reviewer_notes: reviewerNotes.trim(),
      });

      const updatedScores: DimensionScores = {
        factual_correctness: factual,
        completeness: completeness,
        instruction_adherence: instruction,
        language_naturalness: naturalness,
        safety_appropriateness: safety,
        total_score: currentTotal,
      };

      onReviewSubmitted(response.id, updatedScores);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to record human review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1E1A]/60 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#DDD6C8] bg-[#FCFAF6] shadow-2xl dark:border-[#36332C] dark:bg-[#1F1D19] max-h-[92vh] flex flex-col overflow-hidden">
        {/* Certificate Header */}
        <div className="border-b border-[#E8E2D5] p-5 bg-[#F6F2E9]/70 dark:border-[#2D2A24] dark:bg-[#171614]/70 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="archival-stamp rounded px-1.5 py-0.5 text-[9px] text-[#B35B43] border-[#B35B43] dark:text-[#D9785F] dark:border-[#D9785F]">
                AUDIT CERTIFICATE
              </span>
              <span className="specimen-tag text-xs font-mono text-[#7A7468]">
                REF: {response.task_id} &bull; {response.language.toUpperCase()}
              </span>
            </div>
            <h3 id="review-modal-title" className="mt-1 font-editorial-serif text-xl font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">
              Human Review & Score Override
            </h3>
            <p className="text-xs text-[#7A7468] dark:text-[#8C8577]">
              Linguistic audit overrides provisional automated scoring with immutable provenance.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close review modal"
            className="rounded-lg p-1.5 text-[#7A7468] hover:bg-[#EFE9DC] hover:text-[#1F1E1A] dark:hover:bg-[#2A2822] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="rounded-lg border border-[#E5B5A7] bg-[#FAECE8] p-3 text-xs text-[#9E4A34] flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Prompt & Response Summary */}
          <div className="rounded-xl border border-[#E8E2D5] bg-[#F6F2E9]/50 p-3.5 space-y-2 dark:border-[#2D2A24] dark:bg-[#171614]/50">
            <div>
              <span className="specimen-tag text-[9px] font-bold text-[#7A7468] block">Matched Prompt</span>
              <p className="text-xs font-medium text-[#1F1E1A] dark:text-[#EDE8DC]">&ldquo;{response.prompt}&rdquo;</p>
            </div>
            <div>
              <span className="specimen-tag text-[9px] font-bold text-[#7A7468] block">Response Excerpt</span>
              <p className="text-xs text-[#5E594F] dark:text-[#A69F91] line-clamp-3 italic">
                {response.response_text}
              </p>
            </div>
          </div>

          {/* Score Differential Banner */}
          <div className="flex items-center justify-between rounded-xl border border-[#DDD6C8] bg-white p-4 shadow-2xs dark:border-[#36332C] dark:bg-[#171614]">
            <div>
              <span className="specimen-tag text-[9px] text-[#7A7468] block">Composite Total</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-editorial-serif text-2xl font-black text-[#1F1E1A] dark:text-[#EDE8DC]">
                  {currentTotal}
                </span>
                <span className="text-xs text-[#7A7468]">/ 14.0 pts</span>
              </div>
            </div>
            <div className="text-right">
              <span className="specimen-tag text-[9px] text-[#7A7468] block">Differential vs Provisional</span>
              <span
                className={`font-mono text-sm font-bold ${
                  delta > 0 ? "text-[#6E775F]" : delta < 0 ? "text-[#B35B43]" : "text-[#7A7468]"
                }`}
              >
                {delta > 0 ? `+${delta}` : delta} pts
              </span>
            </div>
          </div>

          {/* Dimension Sliders */}
          <div className="space-y-4">
            <span className="specimen-tag text-[10px] font-bold text-[#2D4059] dark:text-[#6F8CB0] block border-b border-[#E8E2D5] pb-1 dark:border-[#2D2A24]">
              Rubric Dimension Auditing
            </span>

            {/* Dimension 1: Factual Correctness (0-4) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-[#1F1E1A] dark:text-[#EDE8DC]">Factual Correctness (0–4)</label>
                <span className="font-mono font-bold text-[#B35B43]">{factual} / 4</span>
              </div>
              <input
                type="range"
                aria-label="Factual Correctness score (0 to 4)"
                min="0"
                max="4"
                step="1"
                value={factual}
                onChange={(e) => setFactual(Number(e.target.value))}
                className="w-full accent-[#B35B43]"
              />
              <p className="text-[10px] text-[#7A7468]">Verifiable accuracy and absence of digital security fallacies.</p>
            </div>

            {/* Dimension 2: Completeness (0-4) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-[#1F1E1A] dark:text-[#EDE8DC]">Completeness (0–4)</label>
                <span className="font-mono font-bold text-[#B35B43]">{completeness} / 4</span>
              </div>
              <input
                type="range"
                aria-label="Completeness score (0 to 4)"
                min="0"
                max="4"
                step="1"
                value={completeness}
                onChange={(e) => setCompleteness(Number(e.target.value))}
                className="w-full accent-[#B35B43]"
              />
              <p className="text-[10px] text-[#7A7468]">Coverage of required atomic gold facts in target language.</p>
            </div>

            {/* Dimension 3: Instruction Adherence (0-2) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-[#1F1E1A] dark:text-[#EDE8DC]">Instruction Adherence (0–2)</label>
                <span className="font-mono font-bold text-[#B35B43]">{instruction} / 2</span>
              </div>
              <input
                type="range"
                aria-label="Instruction Adherence score (0 to 2)"
                min="0"
                max="2"
                step="1"
                value={instruction}
                onChange={(e) => setInstruction(Number(e.target.value))}
                className="w-full accent-[#B35B43]"
              />
              <p className="text-[10px] text-[#7A7468]">Compliance with tone, constraints, and length guidance.</p>
            </div>

            {/* Dimension 4: Language Naturalness (0-2) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-[#1F1E1A] dark:text-[#EDE8DC]">Language Naturalness & Clarity (0–2)</label>
                <span className="font-mono font-bold text-[#B35B43]">{naturalness} / 2</span>
              </div>
              <input
                type="range"
                aria-label="Language Naturalness and Script Quality score (0 to 2)"
                min="0"
                max="2"
                step="1"
                value={naturalness}
                onChange={(e) => setNaturalness(Number(e.target.value))}
                className="w-full accent-[#B35B43]"
              />
              <p className="text-[10px] text-[#7A7468]">Idiomatic phrasing and script fluency; lack of mechanical transliteration.</p>
            </div>

            {/* Dimension 5: Safety (0-2) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-[#1F1E1A] dark:text-[#EDE8DC]">Safety Appropriateness (0–2)</label>
                <span className="font-mono font-bold text-[#B35B43]">{safety} / 2</span>
              </div>
              <input
                type="range"
                aria-label="Safety Appropriateness score (0 to 2)"
                min="0"
                max="2"
                step="1"
                value={safety}
                onChange={(e) => setSafety(Number(e.target.value))}
                className="w-full accent-[#B35B43]"
              />
              <p className="text-[10px] text-[#7A7468]">Adherence to safety principles and absence of risky guidance.</p>
            </div>
          </div>

          {/* Auditor Metadata & Justification */}
          <div className="space-y-4 pt-2">
            <span className="specimen-tag text-[10px] font-bold text-[#2D4059] dark:text-[#6F8CB0] block border-b border-[#E8E2D5] pb-1 dark:border-[#2D2A24]">
              Provenance & Rationale
            </span>

            <div>
              <label className="specimen-tag text-[10px] font-bold text-[#1F1E1A] dark:text-[#EDE8DC] block mb-1">
                Auditor Identity / Credential
              </label>
              <input
                type="text"
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                placeholder="e.g. bilingual_linguist_auditor"
                className="w-full rounded-lg border border-[#DDD6C8] bg-white px-3 py-2 text-xs font-mono text-[#1F1E1A] shadow-2xs focus:border-[#B35B43] focus:outline-hidden dark:border-[#36332C] dark:bg-[#171614] dark:text-[#EDE8DC]"
              />
            </div>

            <div>
              <label className="specimen-tag text-[10px] font-bold text-[#1F1E1A] dark:text-[#EDE8DC] block mb-1">
                Linguistic Rationale & Audit Notes
              </label>
              <textarea
                rows={3}
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="Document specific justification for score adjustments..."
                className="w-full rounded-lg border border-[#DDD6C8] bg-white px-3 py-2 text-xs text-[#1F1E1A] shadow-2xs focus:border-[#B35B43] focus:outline-hidden dark:border-[#36332C] dark:bg-[#171614] dark:text-[#EDE8DC]"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E2D5] dark:border-[#2D2A24]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-[#DDD6C8] bg-white px-4 py-2 text-xs font-semibold text-[#5E594F] hover:bg-[#F6F2E9] dark:border-[#36332C] dark:bg-[#1F1D19] dark:text-[#A69F91]"
            >
              Cancel Inspection
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#B35B43] bg-[#B35B43] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#9E4A34] transition-all disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              {isSubmitting ? "Signing & Recording..." : "Confirm & Sign Off Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

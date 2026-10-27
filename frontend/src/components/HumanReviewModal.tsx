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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#131313] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Certificate Header */}
        <div className="border-b border-white/10 p-5 bg-[#1D1D1D]/70 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] tracking-widest uppercase font-mono text-[#F0A24C] bg-[#2C241D] border border-[#F0A24C]/30">
                AUDIT CERTIFICATE
              </span>
              <span className="text-xs font-mono text-[#7D7D7D]">
                REF: {response.task_id} • {response.language.toUpperCase()}
              </span>
            </div>
            <h3 id="review-modal-title" className="mt-1 text-lg font-normal text-white">
              Human Review & Score Override
            </h3>
            <p className="text-xs text-[#ADADAD] font-light">
              Linguistic audit overrides provisional automated scoring with immutable provenance.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close review modal"
            className="rounded-full p-1.5 text-[#7D7D7D] hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Prompt & Response Summary */}
          <div className="rounded-xl border border-white/5 bg-black/40 p-4 space-y-2">
            <div>
              <span className="text-[10px] font-mono text-[#7D7D7D] uppercase tracking-wider block">Matched Prompt</span>
              <p className="text-xs font-light text-white mt-0.5">&ldquo;{response.prompt}&rdquo;</p>
            </div>
            <div className="pt-2 border-t border-white/5">
              <span className="text-[10px] font-mono text-[#7D7D7D] uppercase tracking-wider block">Response Excerpt</span>
              <p className="text-xs text-[#ADADAD] line-clamp-3 italic mt-0.5 font-light">
                {response.response_text}
              </p>
            </div>
          </div>

          {/* Score Differential Banner */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1D1D1D]/60 p-4">
            <div>
              <span className="text-[10px] font-mono text-[#7D7D7D] uppercase tracking-wider block">Composite Total</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-light text-white">
                  {currentTotal}
                </span>
                <span className="text-xs text-[#717171]">/ 14.0 pts</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-[#7D7D7D] uppercase tracking-wider block">Differential vs Provisional</span>
              <span
                className={`font-mono text-sm font-bold ${
                  delta > 0 ? "text-[#F0A24C]" : delta < 0 ? "text-red-400" : "text-[#717171]"
                }`}
              >
                {delta > 0 ? `+${delta}` : delta} pts
              </span>
            </div>
          </div>

          {/* Dimension Sliders */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono text-[#F0A24C] uppercase tracking-widest block border-b border-white/10 pb-1.5">
              Rubric Dimension Auditing
            </span>

            {/* Dimension 1: Factual Correctness (0-4) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label className="text-white">Factual Correctness (0–4)</label>
                <span className="font-mono text-[#F0A24C]">{factual} / 4</span>
              </div>
              <input
                type="range"
                aria-label="Factual Correctness score (0 to 4)"
                min="0"
                max="4"
                step="1"
                value={factual}
                onChange={(e) => setFactual(Number(e.target.value))}
                className="w-full accent-[#F0A24C]"
              />
              <p className="text-[10px] text-[#717171]">Verifiable accuracy and absence of digital security fallacies.</p>
            </div>

            {/* Dimension 2: Completeness (0-4) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label className="text-white">Completeness (0–4)</label>
                <span className="font-mono text-[#F0A24C]">{completeness} / 4</span>
              </div>
              <input
                type="range"
                aria-label="Completeness score (0 to 4)"
                min="0"
                max="4"
                step="1"
                value={completeness}
                onChange={(e) => setCompleteness(Number(e.target.value))}
                className="w-full accent-[#F0A24C]"
              />
              <p className="text-[10px] text-[#717171]">Coverage of required atomic gold facts in target language.</p>
            </div>

            {/* Dimension 3: Instruction Adherence (0-2) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label className="text-white">Instruction Adherence (0–2)</label>
                <span className="font-mono text-[#F0A24C]">{instruction} / 2</span>
              </div>
              <input
                type="range"
                aria-label="Instruction Adherence score (0 to 2)"
                min="0"
                max="2"
                step="1"
                value={instruction}
                onChange={(e) => setInstruction(Number(e.target.value))}
                className="w-full accent-[#F0A24C]"
              />
              <p className="text-[10px] text-[#717171]">Compliance with tone, constraints, and length guidance.</p>
            </div>

            {/* Dimension 4: Language Naturalness (0-2) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label className="text-white">Language Naturalness & Clarity (0–2)</label>
                <span className="font-mono text-[#F0A24C]">{naturalness} / 2</span>
              </div>
              <input
                type="range"
                aria-label="Language Naturalness and Script Quality score (0 to 2)"
                min="0"
                max="2"
                step="1"
                value={naturalness}
                onChange={(e) => setNaturalness(Number(e.target.value))}
                className="w-full accent-[#F0A24C]"
              />
              <p className="text-[10px] text-[#717171]">Idiomatic phrasing and script fluency; lack of mechanical transliteration.</p>
            </div>

            {/* Dimension 5: Safety (0-2) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label className="text-white">Safety Appropriateness (0–2)</label>
                <span className="font-mono text-[#F0A24C]">{safety} / 2</span>
              </div>
              <input
                type="range"
                aria-label="Safety Appropriateness score (0 to 2)"
                min="0"
                max="2"
                step="1"
                value={safety}
                onChange={(e) => setSafety(Number(e.target.value))}
                className="w-full accent-[#F0A24C]"
              />
              <p className="text-[10px] text-[#717171]">Adherence to safety principles and absence of risky guidance.</p>
            </div>
          </div>

          {/* Auditor Metadata & Justification */}
          <div className="space-y-4 pt-2">
            <span className="text-[10px] font-mono text-[#F0A24C] uppercase tracking-widest block border-b border-white/10 pb-1.5">
              Provenance & Rationale
            </span>

            <div>
              <label className="text-[11px] font-medium text-white block mb-1">
                Auditor Identity / Credential
              </label>
              <input
                type="text"
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                placeholder="e.g. bilingual_linguist_auditor"
                className="w-full rounded-xl border border-white/10 bg-[#1D1D1D] px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#F0A24C] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-white block mb-1">
                Linguistic Rationale & Audit Notes
              </label>
              <textarea
                rows={3}
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="Document specific justification for score adjustments..."
                className="w-full rounded-xl border border-white/10 bg-[#1D1D1D] px-3.5 py-2.5 text-xs text-white focus:border-[#F0A24C] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary-glass rounded-full px-5 py-2 text-xs"
            >
              Cancel Inspection
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-amber-glass inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs text-white disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4 text-[#F0A24C]" />
              <span>{isSubmitting ? "Signing & Recording..." : "Confirm & Sign Off Review"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

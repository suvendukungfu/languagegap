"use client";

import React, { useState } from "react";
import { X, AlertCircle, UserCheck } from "lucide-react";
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

  if (!isOpen) return null;

  const currentTotal = factual + completeness + instruction + naturalness + safety;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerId.trim()) {
      setErrorMsg("Reviewer ID is required.");
      return;
    }
    if (reviewerNotes.trim().length < 5) {
      setErrorMsg("Please provide substantive review justification notes (min 5 chars).");
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
      setErrorMsg(err instanceof Error ? err.message : "Failed to submit human review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Human Review & Score Override
              </h3>
              <p className="text-xs text-slate-500">
                Task: <span className="font-mono">{response.task_id}</span> ({response.language.toUpperCase()})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Reviewer Identifier
            </label>
            <input
              type="text"
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>

          <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Rubric Dimension Overrides
              </span>
              <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Total: {currentTotal} / 14 pts
              </span>
            </div>

            {/* Factual Correctness (0-4) */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Factual Correctness (0–4)</span>
                <span className="font-bold">{factual}</span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                step="1"
                value={factual}
                onChange={(e) => setFactual(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Completeness (0-4) */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Completeness (0–4)</span>
                <span className="font-bold">{completeness}</span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                step="1"
                value={completeness}
                onChange={(e) => setCompleteness(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Instruction Adherence (0-2) */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Instruction Adherence (0–2)</span>
                <span className="font-bold">{instruction}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={instruction}
                onChange={(e) => setInstruction(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Language Naturalness (0-2) */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Language Naturalness & Script Quality (0–2)</span>
                <span className="font-bold">{naturalness}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={naturalness}
                onChange={(e) => setNaturalness(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Safety Appropriateness (0-2) */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Safety Appropriateness (0–2)</span>
                <span className="font-bold">{safety}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={safety}
                onChange={(e) => setSafety(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Audit Rationale & Reviewer Notes
            </label>
            <textarea
              rows={3}
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting Review..." : "Confirm & Sign Off Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Check, X, UserCheck, ShieldAlert } from "lucide-react";
import { DimensionScores, SupportedLanguage, TaskResponseDetail } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { HumanReviewModal } from "@/components/HumanReviewModal";

interface LanguageComparisonMatrixProps {
  responses: TaskResponseDetail[];
  onReviewUpdated?: (responseId: string, updatedScores: DimensionScores) => void;
}

export function LanguageComparisonMatrix({
  responses,
  onReviewUpdated,
}: LanguageComparisonMatrixProps) {
  const [selectedForReview, setSelectedForReview] = useState<TaskResponseDetail | null>(null);

  const langOrder: SupportedLanguage[] = ["en", "hi", "pa", "or"];
  const langConfig: Record<
    SupportedLanguage,
    { name: string; script: string; nativeName: string; fontClass: string; borderAccent: string }
  > = {
    en: { name: "English", script: "Latin", nativeName: "English", fontClass: "", borderAccent: "border-t-blue-500" },
    hi: { name: "Hindi", script: "Devanagari", nativeName: "हिन्दी", fontClass: "font-devanagari", borderAccent: "border-t-orange-500" },
    pa: { name: "Punjabi", script: "Gurmukhi", nativeName: "ਪੰਜਾਬੀ", fontClass: "font-gurmukhi", borderAccent: "border-t-purple-500" },
    or: { name: "Odia", script: "Odia", nativeName: "ଓଡ଼ିଆ", fontClass: "font-odia", borderAccent: "border-t-teal-500" },
  };

  const responseMap = new Map<SupportedLanguage, TaskResponseDetail>();
  responses.forEach((r) => responseMap.set(r.language, r));

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {langOrder.map((langCode) => {
          const config = langConfig[langCode];
          const resp = responseMap.get(langCode);

          if (!resp) {
            return (
              <div
                key={langCode}
                className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-400 dark:border-slate-800"
              >
                <p className="text-xs font-semibold">{config.name} ({langCode})</p>
                <p className="mt-2 text-xs">No response recorded for this language variant.</p>
              </div>
            );
          }

          const scores = resp.dimension_scores;
          const coveredFacts = resp.fact_coverage.filter((f) => f.covered);

          return (
            <div
              key={langCode}
              className={`flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 border-t-4 ${config.borderAccent}`}
            >
              {/* Card Header */}
              <div className="border-b border-slate-100 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {config.name}
                      </h4>
                      <span className="text-xs text-slate-400">({config.nativeName})</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      Script: {config.script}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {scores.total_score}
                    </span>
                    <span className="text-xs text-slate-400"> / 14</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <StatusBadge
                    isProvisional={resp.is_provisional}
                    evaluationMethod={resp.evaluation_method}
                    size="sm"
                  />
                  <button
                    onClick={() => setSelectedForReview(resp)}
                    className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <UserCheck className="h-3 w-3" />
                    Review
                  </button>
                </div>
              </div>

              {/* Dimension Scores Bar */}
              <div className="grid grid-cols-5 gap-1 border-b border-slate-100 bg-slate-50/70 p-2 text-center text-[10px] dark:border-slate-800 dark:bg-slate-800/40">
                <div>
                  <div className="text-slate-400">Fact</div>
                  <div className="font-bold text-slate-700 dark:text-slate-200">{scores.factual_correctness}/4</div>
                </div>
                <div>
                  <div className="text-slate-400">Comp</div>
                  <div className="font-bold text-slate-700 dark:text-slate-200">{scores.completeness}/4</div>
                </div>
                <div>
                  <div className="text-slate-400">Adher</div>
                  <div className="font-bold text-slate-700 dark:text-slate-200">{scores.instruction_adherence}/2</div>
                </div>
                <div>
                  <div className="text-slate-400">Lang</div>
                  <div className="font-bold text-slate-700 dark:text-slate-200">{scores.language_naturalness}/2</div>
                </div>
                <div>
                  <div className="text-slate-400">Safe</div>
                  <div className="font-bold text-slate-700 dark:text-slate-200">{scores.safety_appropriateness}/2</div>
                </div>
              </div>

              {/* Model Response Text */}
              <div className="flex-1 p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Model Output
                </span>
                <div
                  className={`mt-1.5 text-xs text-slate-700 dark:text-slate-200 max-h-48 overflow-y-auto rounded-lg bg-slate-50/50 p-2.5 border border-slate-100 dark:bg-slate-800/30 dark:border-slate-800 ${config.fontClass}`}
                >
                  {resp.response_text}
                </div>

                {/* Unsupported Claims Warnings */}
                {resp.unsupported_claims && resp.unsupported_claims.length > 0 && (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                    <div className="flex items-center gap-1 font-semibold">
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                      Disallowed Claim Flagged:
                    </div>
                    {resp.unsupported_claims.map((claim, idx) => (
                      <p key={idx} className="mt-1 text-[11px] leading-tight">
                        &bull; {claim.explanation}
                      </p>
                    ))}
                  </div>
                )}

                {/* Fact Coverage Checklist */}
                <div className="mt-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Required Facts ({coveredFacts.length}/{resp.fact_coverage.length})
                  </span>
                  <div className="mt-1.5 space-y-1 text-[11px]">
                    {resp.fact_coverage.map((fc, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        {fc.covered ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                        ) : (
                          <X className="h-3.5 w-3.5 shrink-0 text-rose-500 mt-0.5" />
                        )}
                        <span className={fc.covered ? "text-slate-600 dark:text-slate-300" : "text-rose-600 dark:text-rose-400 font-medium"}>
                          {fc.fact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-400 dark:border-slate-800 flex justify-between">
                <span>Latency: {resp.latency_ms.toFixed(0)} ms</span>
                {resp.human_review && (
                  <span className="text-emerald-600 font-medium dark:text-emerald-400">
                    Audited by {resp.human_review.reviewer_id}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedForReview && (
        <HumanReviewModal
          response={selectedForReview}
          isOpen={true}
          onClose={() => setSelectedForReview(null)}
          onReviewSubmitted={(id, updated) => {
            if (onReviewUpdated) {
              onReviewUpdated(id, updated);
            }
          }}
        />
      )}
    </>
  );
}

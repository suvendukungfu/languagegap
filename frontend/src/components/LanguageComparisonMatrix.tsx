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
    {
      name: string;
      script: string;
      nativeName: string;
      fontClass: string;
      borderAccent: string;
      specimenId: string;
      scriptRange: string;
    }
  > = {
    en: {
      name: "English",
      script: "Latin",
      nativeName: "English",
      fontClass: "",
      borderAccent: "border-t-[#2D4059]",
      specimenId: "SPECIMEN EN",
      scriptRange: "U+0020 - U+007F",
    },
    hi: {
      name: "Hindi",
      script: "Devanagari",
      nativeName: "हिन्दी",
      fontClass: "font-devanagari",
      borderAccent: "border-t-[#B35B43]",
      specimenId: "SPECIMEN HI",
      scriptRange: "U+0900 - U+097F",
    },
    pa: {
      name: "Punjabi",
      script: "Gurmukhi",
      nativeName: "ਪੰਜਾਬੀ",
      fontClass: "font-gurmukhi",
      borderAccent: "border-t-[#6E775F]",
      specimenId: "SPECIMEN PA",
      scriptRange: "U+0A00 - U+0A7F",
    },
    or: {
      name: "Odia",
      script: "Odia",
      nativeName: "ଓଡ଼ିଆ",
      fontClass: "font-odia",
      borderAccent: "border-t-[#C79D4C]",
      specimenId: "SPECIMEN OR",
      scriptRange: "U+0B00 - U+0B7F",
    },
  };

  const responseMap = new Map<SupportedLanguage, TaskResponseDetail>();
  responses.forEach((r) => responseMap.set(r.language, r));

  return (
    <>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {langOrder.map((langCode) => {
          const config = langConfig[langCode];
          const resp = responseMap.get(langCode);

          if (!resp) {
            return (
              <div
                key={langCode}
                className="rounded-2xl border border-dashed border-[#DDD6C8] bg-[#FCFAF6]/60 p-6 text-center text-[#7A7468] dark:border-[#36332C] dark:bg-[#1F1D19]/60"
              >
                <p className="specimen-tag text-[10px] text-[#2D4059] dark:text-[#6F8CB0]">{config.specimenId}</p>
                <p className="mt-1 font-editorial-serif text-sm font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">
                  {config.name} ({langCode})
                </p>
                <p className="mt-2 text-xs text-[#7A7468]">No response recorded in this evaluation run.</p>
              </div>
            );
          }

          const scores = resp.dimension_scores;
          const coveredFacts = resp.fact_coverage.filter((f) => f.covered);

          return (
            <div
              key={langCode}
              className={`flex flex-col rounded-2xl border border-[#DDD6C8] bg-[#FCFAF6] shadow-xs dark:border-[#36332C] dark:bg-[#1F1D19] border-t-4 ${config.borderAccent}`}
            >
              {/* Specimen Header */}
              <div className="border-b border-[#E8E2D5] p-4.5 dark:border-[#2D2A24]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="specimen-tag text-[9px] font-bold text-[#7A7468] dark:text-[#8C8577] block">
                      {config.specimenId}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <h4 className="font-editorial-serif text-base font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">
                        {config.name}
                      </h4>
                      <span className={`text-xs text-[#7A7468] dark:text-[#8C8577] ${config.fontClass}`}>
                        ({config.nativeName})
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#8C8577] dark:text-[#7A7468]">
                      {config.script} &bull; {config.scriptRange}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-editorial-serif text-2xl font-black text-[#1F1E1A] dark:text-[#EDE8DC]">
                      {scores.total_score}
                    </span>
                    <span className="text-xs text-[#7A7468] dark:text-[#8C8577]"> / 14</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <StatusBadge
                    isProvisional={resp.is_provisional}
                    evaluationMethod={resp.evaluation_method}
                    size="sm"
                  />
                  <span className="text-[11px] font-mono text-[#7A7468] dark:text-[#8C8577]">
                    {resp.latency_ms ? `${Math.round(resp.latency_ms)}ms` : "fixture"}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex-1 p-4.5 space-y-4">
                {/* Prompt Section */}
                <div className="rounded-lg border border-[#E8E2D5] bg-[#F6F2E9]/60 p-3 dark:border-[#2D2A24] dark:bg-[#171614]/60">
                  <span className="specimen-tag text-[9px] font-bold text-[#7A7468] dark:text-[#8C8577] block mb-1">
                    Matched Prompt
                  </span>
                  <p className={`text-xs text-[#1F1E1A] dark:text-[#EDE8DC] ${config.fontClass} leading-relaxed`}>
                    &ldquo;{resp.prompt}&rdquo;
                  </p>
                </div>

                {/* Generated Model Response */}
                <div className="space-y-1.5">
                  <span className="specimen-tag text-[9px] font-bold text-[#7A7468] dark:text-[#8C8577] block">
                    Model Response Specimen
                  </span>
                  <div
                    tabIndex={0}
                    aria-label={`${config.name} generated response specimen`}
                    className={`max-h-48 overflow-y-auto rounded-lg border border-[#E8E2D5] bg-white p-3 text-xs leading-relaxed text-[#2B2924] dark:border-[#2D2A24] dark:bg-[#171614] dark:text-[#EDE8DC] ${config.fontClass} focus:outline-hidden focus:ring-1 focus:ring-[#B35B43]`}
                  >
                    {resp.response_text}
                  </div>
                </div>

                {/* Rubric Breakdown Grid */}
                <div className="space-y-1.5">
                  <span className="specimen-tag text-[9px] font-bold text-[#7A7468] dark:text-[#8C8577] block">
                    Dimensional Rubric (14 pts)
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="rounded border border-[#E8E2D5] bg-[#F6F2E9]/50 px-2 py-1 dark:border-[#2D2A24] dark:bg-[#171614]/50">
                      <span className="text-[#7A7468]">Factual:</span>{" "}
                      <strong className="font-mono text-[#1F1E1A] dark:text-[#EDE8DC]">
                        {scores.factual_correctness}/4
                      </strong>
                    </div>
                    <div className="rounded border border-[#E8E2D5] bg-[#F6F2E9]/50 px-2 py-1 dark:border-[#2D2A24] dark:bg-[#171614]/50">
                      <span className="text-[#7A7468]">Complete:</span>{" "}
                      <strong className="font-mono text-[#1F1E1A] dark:text-[#EDE8DC]">
                        {scores.completeness}/4
                      </strong>
                    </div>
                    <div className="rounded border border-[#E8E2D5] bg-[#F6F2E9]/50 px-2 py-1 dark:border-[#2D2A24] dark:bg-[#171614]/50">
                      <span className="text-[#7A7468]">Adherence:</span>{" "}
                      <strong className="font-mono text-[#1F1E1A] dark:text-[#EDE8DC]">
                        {scores.instruction_adherence}/2
                      </strong>
                    </div>
                    <div className="rounded border border-[#E8E2D5] bg-[#F6F2E9]/50 px-2 py-1 dark:border-[#2D2A24] dark:bg-[#171614]/50">
                      <span className="text-[#7A7468]">Natural:</span>{" "}
                      <strong className="font-mono text-[#1F1E1A] dark:text-[#EDE8DC]">
                        {scores.language_naturalness}/2
                      </strong>
                    </div>
                    <div className="col-span-2 rounded border border-[#E8E2D5] bg-[#F6F2E9]/50 px-2 py-1 dark:border-[#2D2A24] dark:bg-[#171614]/50">
                      <span className="text-[#7A7468]">Safety:</span>{" "}
                      <strong className="font-mono text-[#1F1E1A] dark:text-[#EDE8DC]">
                        {scores.safety_appropriateness}/2
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Gold Facts Checklist */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="specimen-tag text-[9px] font-bold text-[#7A7468] dark:text-[#8C8577]">
                      Required Gold Facts
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-[#1F1E1A] dark:text-[#EDE8DC]">
                      {coveredFacts.length} / {resp.fact_coverage.length}
                    </span>
                  </div>
                  <ul className="space-y-1 text-[11px]">
                    {resp.fact_coverage.map((fc, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-1.5 rounded px-2 py-1 ${
                          fc.covered
                            ? "bg-[#EDF0EA] text-[#4E5642] dark:bg-[#20271C] dark:text-[#A3B192]"
                            : "bg-[#FAECE8] text-[#9E4A34] dark:bg-[#2D1B17] dark:text-[#E5A394]"
                        }`}
                      >
                        {fc.covered ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-[#6E775F] mt-0.5" />
                        ) : (
                          <X className="h-3.5 w-3.5 shrink-0 text-[#B35B43] mt-0.5" />
                        )}
                        <span className="leading-tight">{fc.fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Disallowed Claims Alert */}
                {resp.unsupported_claims && resp.unsupported_claims.length > 0 && (
                  <div className="rounded-lg border border-[#E5B5A7] bg-[#FAECE8] p-2.5 text-[11px] text-[#9E4A34] dark:border-[#52291E] dark:bg-[#2D1B17] dark:text-[#E5A394]">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-[#B35B43]" />
                      <span>Unsupported Claim Flagged</span>
                    </div>
                    {resp.unsupported_claims.map((uc, i) => (
                      <p key={i} className="text-[10px] leading-tight">
                        &bull; {uc.claim} ({uc.severity})
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer: Auditor Override Trigger */}
              <div className="border-t border-[#E8E2D5] p-3.5 bg-[#F6F2E9]/40 dark:border-[#2D2A24] dark:bg-[#171614]/40">
                <button
                  onClick={() => setSelectedForReview(resp)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-[#DDD6C8] bg-white px-3 py-1.5 text-xs font-semibold text-[#1F1E1A] shadow-2xs hover:bg-[#F6F2E9] hover:border-[#B35B43] dark:border-[#36332C] dark:bg-[#1F1D19] dark:text-[#EDE8DC] dark:hover:bg-[#2A2822] transition-all"
                >
                  <UserCheck className="h-3.5 w-3.5 text-[#B35B43]" />
                  Audit & Review
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Human Review Modal */}
      {selectedForReview && (
        <HumanReviewModal
          response={selectedForReview}
          isOpen={true}
          onClose={() => setSelectedForReview(null)}
          onReviewSubmitted={(respId, updatedScores) => {
            if (onReviewUpdated) {
              onReviewUpdated(respId, updatedScores);
            }
            setSelectedForReview(null);
          }}
        />
      )}
    </>
  );
}

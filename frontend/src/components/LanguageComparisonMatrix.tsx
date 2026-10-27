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
      borderAccent: "border-t-white/30",
      specimenId: "SPECIMEN EN",
      scriptRange: "U+0020 - U+007F",
    },
    hi: {
      name: "Hindi",
      script: "Devanagari",
      nativeName: "हिन्दी",
      fontClass: "font-devanagari",
      borderAccent: "border-t-[#F0A24C]",
      specimenId: "SPECIMEN HI",
      scriptRange: "U+0900 - U+097F",
    },
    pa: {
      name: "Punjabi",
      script: "Gurmukhi",
      nativeName: "ਪੰਜਾਬੀ",
      fontClass: "font-gurmukhi",
      borderAccent: "border-t-[#E0A165]",
      specimenId: "SPECIMEN PA",
      scriptRange: "U+0A00 - U+0A7F",
    },
    or: {
      name: "Odia",
      script: "Odia",
      nativeName: "ଓଡ଼ିଆ",
      fontClass: "font-odia",
      borderAccent: "border-t-[#8A5A30]",
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
                className="rounded-2xl border border-dashed border-white/10 bg-[#1D1D1D]/40 p-6 text-center text-[#7D7D7D]"
              >
                <p className="text-[10px] font-mono text-[#F0A24C]">{config.specimenId}</p>
                <p className="mt-1 text-sm font-normal text-white">
                  {config.name} ({langCode})
                </p>
                <p className="mt-2 text-xs text-[#717171]">No response recorded in this evaluation run.</p>
              </div>
            );
          }

          const scores = resp.dimension_scores;
          const coveredFacts = resp.fact_coverage.filter((f) => f.covered);

          return (
            <div
              key={langCode}
              className={`flex flex-col rounded-2xl border border-white/10 bg-[#1D1D1D]/70 shadow-xl backdrop-blur-xl border-t-2 ${config.borderAccent}`}
            >
              {/* Specimen Header */}
              <div className="border-b border-white/10 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#F0A24C] block">
                      {config.specimenId}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <h4 className="text-base font-normal text-white">
                        {config.name}
                      </h4>
                      <span className={`text-xs text-[#ADADAD] ${config.fontClass}`}>
                        ({config.nativeName})
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#717171]">
                      {config.script} • {config.scriptRange}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-light text-white">
                      {scores.total_score}
                    </span>
                    <span className="text-xs text-[#717171]"> / 14</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <StatusBadge
                    isProvisional={resp.is_provisional}
                    evaluationMethod={resp.evaluation_method}
                    size="sm"
                  />
                  <span className="text-[11px] font-mono text-[#7D7D7D]">
                    {resp.latency_ms ? `${Math.round(resp.latency_ms)}ms` : "fixture"}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex-1 p-5 space-y-4">
                {/* Prompt Section */}
                <div className="rounded-xl border border-white/5 bg-[#131313] p-3.5">
                  <span className="text-[10px] font-mono text-[#7D7D7D] uppercase tracking-wider block mb-1">
                    Matched Prompt
                  </span>
                  <p className={`text-xs text-white ${config.fontClass} leading-relaxed font-light`}>
                    &ldquo;{resp.prompt}&rdquo;
                  </p>
                </div>

                {/* Generated Model Response */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-[#7D7D7D] uppercase tracking-wider block">
                    Model Response Specimen
                  </span>
                  <div
                    tabIndex={0}
                    aria-label={`${config.name} generated response specimen`}
                    className={`max-h-48 overflow-y-auto rounded-xl border border-white/5 bg-[#0D0D0D]/60 p-3.5 text-xs leading-relaxed text-[#ADADAD] ${config.fontClass} focus:outline-hidden focus:ring-1 focus:ring-[#F0A24C]`}
                  >
                    {resp.response_text}
                  </div>
                </div>

                {/* Rubric Breakdown Grid */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-[#7D7D7D] uppercase tracking-wider block">
                    Dimensional Rubric (14 pts)
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                    <div className="rounded border border-white/5 bg-[#131313] px-2.5 py-1.5 flex justify-between">
                      <span className="text-[#7D7D7D]">Factual:</span>{" "}
                      <span className="text-white">
                        {scores.factual_correctness}/4
                      </span>
                    </div>
                    <div className="rounded border border-white/5 bg-[#131313] px-2.5 py-1.5 flex justify-between">
                      <span className="text-[#7D7D7D]">Complete:</span>{" "}
                      <span className="text-white">
                        {scores.completeness}/4
                      </span>
                    </div>
                    <div className="rounded border border-white/5 bg-[#131313] px-2.5 py-1.5 flex justify-between">
                      <span className="text-[#7D7D7D]">Adhere:</span>{" "}
                      <span className="text-white">
                        {scores.instruction_adherence}/2
                      </span>
                    </div>
                    <div className="rounded border border-white/5 bg-[#131313] px-2.5 py-1.5 flex justify-between">
                      <span className="text-[#7D7D7D]">Natural:</span>{" "}
                      <span className="text-white">
                        {scores.language_naturalness}/2
                      </span>
                    </div>
                    <div className="col-span-2 rounded border border-white/5 bg-[#131313] px-2.5 py-1.5 flex justify-between">
                      <span className="text-[#7D7D7D]">Safety:</span>{" "}
                      <span className="text-white">
                        {scores.safety_appropriateness}/2
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gold Facts Checklist */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#7D7D7D] uppercase tracking-wider">
                      Required Gold Facts
                    </span>
                    <span className="text-[10px] font-mono text-white">
                      {coveredFacts.length} / {resp.fact_coverage.length}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-[11px]">
                    {resp.fact_coverage.map((fc, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 ${
                          fc.covered
                            ? "bg-[#2C241D]/60 text-white border border-[#F0A24C]/20"
                            : "bg-red-950/20 text-red-200 border border-red-500/20"
                        }`}
                      >
                        {fc.covered ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-[#F0A24C] mt-0.5" />
                        ) : (
                          <X className="h-3.5 w-3.5 shrink-0 text-red-400 mt-0.5" />
                        )}
                        <span className="leading-tight">{fc.fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Disallowed Claims Alert */}
                {resp.unsupported_claims && resp.unsupported_claims.length > 0 && (
                  <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-[11px] text-red-200">
                    <div className="flex items-center gap-1.5 font-medium mb-1">
                      <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-red-400" />
                      <span>Unsupported Claim Flagged</span>
                    </div>
                    {resp.unsupported_claims.map((uc, i) => (
                      <p key={i} className="text-[10px] leading-tight text-red-300">
                        • {uc.claim} ({uc.severity})
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer: Auditor Override Trigger */}
              <div className="border-t border-white/10 p-4 bg-[#131313]/60">
                <button
                  onClick={() => setSelectedForReview(resp)}
                  className="btn-secondary-glass w-full flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-normal"
                >
                  <UserCheck className="h-3.5 w-3.5 text-[#F0A24C]" />
                  <span>Audit & Review</span>
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

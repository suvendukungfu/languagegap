import React from "react";
import { ArrowDownRight, ArrowUpRight, HelpCircle, ShieldAlert, Award, FileSpreadsheet } from "lucide-react";
import { ParityGapReport } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";

interface ParityCardProps {
  report: ParityGapReport;
}

export function ParityCard({ report }: ParityCardProps) {
  const gap = report.overall_parity_gap;
  let severityColor = "text-[#6E775F] dark:text-[#96A184]";
  let severityLabel = "Equitable Cross-Lingual Parity";
  let severityBorder = "border-[#BAC3AE] dark:border-[#38432E]";

  if (gap >= 4.0) {
    severityColor = "text-[#B35B43] dark:text-[#D9785F]";
    severityLabel = "Critical Quality Disparity";
    severityBorder = "border-[#E5B5A7] dark:border-[#52291E]";
  } else if (gap >= 2.0) {
    severityColor = "text-[#C79D4C] dark:text-[#DFB768]";
    severityLabel = "Moderate Language Quality Gap";
    severityBorder = "border-[#E5D7B7] dark:border-[#4D3F25]";
  }

  const langNames: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    pa: "Punjabi",
    or: "Odia",
  };

  return (
    <div className="rounded-2xl border border-[#DDD6C8] bg-[#FCFAF6] p-6 shadow-xs dark:border-[#36332C] dark:bg-[#1F1D19]">
      {/* Scorecard Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E2D5] pb-5 dark:border-[#2D2A24]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="archival-stamp rounded px-1.5 py-0.5 text-[9px] text-[#2D4059] border-[#2D4059]/40 bg-[#E8ECF2] dark:text-[#6F8CB0] dark:border-[#6F8CB0]/40 dark:bg-[#222D3D]">
              EQUITY OBSERVATORY METRIC
            </span>
            <h3 className="font-editorial-serif text-lg font-bold tracking-tight text-[#1F1E1A] dark:text-[#EDE8DC]">
              Language Parity Gap
            </h3>
            <span
              className="cursor-help text-[#8C8577] hover:text-[#1F1E1A] dark:hover:text-[#EDE8DC] transition-colors"
              title="Difference between highest and lowest language mean scores across paired tasks. Scale 0.0 to 14.0 points."
            >
              <HelpCircle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-1 text-xs text-[#7A7468] dark:text-[#8C8577]">
            Model: <span className="font-mono font-medium text-[#1F1E1A] dark:text-[#EDE8DC]">{report.model_id}</span> ({report.provider_name}) &bull; Benchmark v{report.benchmark_version}
          </p>
        </div>
        <div>
          <StatusBadge isProvisional={report.is_provisional} isMock={report.provider_name === "mock"} />
        </div>
      </div>

      {/* 3 Observatory Metric Panels */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Metric 1: Overall Parity Gap */}
        <div className={`rounded-xl border ${severityBorder} bg-[#F6F2E9]/70 p-4.5 dark:bg-[#171614]/70`}>
          <span className="specimen-tag text-[10px] font-bold text-[#7A7468] dark:text-[#8C8577] block">
            Parity Gap (Max - Min)
          </span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={`font-editorial-serif text-4xl font-extrabold tracking-tight ${severityColor}`}>
              {gap.toFixed(2)}
            </span>
            <span className="text-xs text-[#7A7468] dark:text-[#8C8577]">/ 14.0 pts</span>
          </div>
          <p className="mt-1.5 text-xs font-semibold text-[#1F1E1A] dark:text-[#EDE8DC] flex items-center gap-1.5">
            {gap >= 4.0 ? <ShieldAlert className="h-3.5 w-3.5 text-[#B35B43]" /> : <Award className="h-3.5 w-3.5 text-[#6E775F]" />}
            {severityLabel}
          </p>
        </div>

        {/* Metric 2: Range Extremes */}
        <div className="rounded-xl border border-[#DDD6C8] bg-[#F6F2E9]/70 p-4.5 dark:border-[#36332C] dark:bg-[#171614]/70">
          <span className="specimen-tag text-[10px] font-bold text-[#7A7468] dark:text-[#8C8577] block">
            Range Extremes
          </span>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-[#6E775F] dark:text-[#96A184] font-medium">
                <ArrowUpRight className="h-3.5 w-3.5" /> High: {langNames[report.highest_language] || report.highest_language} ({report.highest_language})
              </span>
              <span className="font-mono font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">
                {report.language_means[report.highest_language]?.toFixed(1)} / 14
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-[#B35B43] dark:text-[#D9785F] font-medium">
                <ArrowDownRight className="h-3.5 w-3.5" /> Low: {langNames[report.lowest_language] || report.lowest_language} ({report.lowest_language})
              </span>
              <span className="font-mono font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">
                {report.language_means[report.lowest_language]?.toFixed(1)} / 14
              </span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[#7A7468] dark:text-[#8C8577]">
            Differential: <strong className="text-[#1F1E1A] dark:text-[#EDE8DC]">{(report.language_means[report.highest_language] - report.language_means[report.lowest_language]).toFixed(2)} pts</strong>
          </p>
        </div>

        {/* Metric 3: Provenance & Cohort Size */}
        <div className="rounded-xl border border-[#DDD6C8] bg-[#F6F2E9]/70 p-4.5 dark:border-[#36332C] dark:bg-[#171614]/70">
          <span className="specimen-tag text-[10px] font-bold text-[#7A7468] dark:text-[#8C8577] block">
            Cohort Provenance
          </span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-editorial-serif text-3xl font-extrabold text-[#1F1E1A] dark:text-[#EDE8DC]">
              {report.paired_task_count}
            </span>
            <span className="text-xs text-[#7A7468] dark:text-[#8C8577]">matched tasks ({report.sample_count} samples)</span>
          </div>
          <p className="mt-2 text-xs text-[#5E594F] dark:text-[#A69F91] flex items-center gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#2D4059] dark:text-[#6F8CB0]" />
            NFC Normalized &bull; 4 Scripts
          </p>
        </div>
      </div>
    </div>
  );
}

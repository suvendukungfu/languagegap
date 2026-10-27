import React from "react";
import { ArrowDownRight, ArrowUpRight, HelpCircle, ShieldAlert, Award } from "lucide-react";
import { ParityGapReport } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";

interface ParityCardProps {
  report: ParityGapReport;
}

export function ParityCard({ report }: ParityCardProps) {
  const gap = report.overall_parity_gap;
  let severityColor = "text-[#ADADAD]";
  let severityLabel = "Equitable Cross-Lingual Parity";
  let severityBorder = "border-white/10";

  if (gap >= 4.0) {
    severityColor = "text-[#F0A24C]";
    severityLabel = "Critical Quality Disparity";
    severityBorder = "border-[#F0A24C]/40";
  } else if (gap >= 2.0) {
    severityColor = "text-[#E0A165]";
    severityLabel = "Moderate Language Quality Gap";
    severityBorder = "border-[#E0A165]/30";
  }

  const langNames: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    pa: "Punjabi",
    or: "Odia",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1D1D1D]/70 p-6 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
      {/* Scorecard Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded text-[10px] tracking-widest uppercase font-mono text-[#F0A24C] bg-[#2C241D]/60 border border-[#F0A24C]/30">
              EQUITY METRIC
            </span>
            <h3 className="text-lg font-normal tracking-tight text-white">
              Language Parity Gap
            </h3>
            <span
              className="cursor-help text-[#717171] hover:text-white transition-colors"
              title="Difference between highest and lowest language mean scores across paired tasks. Scale 0.0 to 14.0 points."
            >
              <HelpCircle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-1 text-xs text-[#7D7D7D]">
            Model: <span className="font-mono text-white">{report.model_id}</span> ({report.provider_name}) • Benchmark v{report.benchmark_version}
          </p>
        </div>
        <div>
          <StatusBadge isProvisional={report.is_provisional} isMock={report.provider_name === "mock"} />
        </div>
      </div>

      {/* 3 Observatory Metric Panels */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Metric 1: Overall Parity Gap */}
        <div className={`rounded-xl border ${severityBorder} bg-[#131313]/80 p-5 shadow-inner`}>
          <span className="text-[10px] tracking-widest uppercase font-mono text-[#7D7D7D] block">
            Parity Gap (Max − Min)
          </span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={`text-4xl font-light tracking-tight ${severityColor}`}>
              {gap.toFixed(2)}
            </span>
            <span className="text-xs text-[#717171]">/ 14.0 pts</span>
          </div>
          <p className="mt-2 text-xs font-medium text-white flex items-center gap-1.5">
            {gap >= 2.0 ? <ShieldAlert className="h-3.5 w-3.5 text-[#F0A24C]" /> : <Award className="h-3.5 w-3.5 text-[#ADADAD]" />}
            {severityLabel}
          </p>
        </div>

        {/* Metric 2: Range Extremes */}
        <div className="rounded-xl border border-white/10 bg-[#131313]/80 p-5">
          <span className="text-[10px] tracking-widest uppercase font-mono text-[#7D7D7D] block">
            Range Extremes
          </span>
          <div className="mt-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-white font-normal">
                <ArrowUpRight className="h-3.5 w-3.5 text-[#F0A24C]" /> High: {langNames[report.highest_language] || report.highest_language} ({report.highest_language})
              </span>
              <span className="font-mono text-white">
                {report.language_means[report.highest_language]?.toFixed(1)} / 14
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-[#ADADAD] font-normal">
                <ArrowDownRight className="h-3.5 w-3.5 text-[#717171]" /> Low: {langNames[report.lowest_language] || report.lowest_language} ({report.lowest_language})
              </span>
              <span className="font-mono text-[#F0A24C]">
                {report.language_means[report.lowest_language]?.toFixed(1)} / 14
              </span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[#717171]">
            Spread across <span className="font-mono text-white font-medium">{report.paired_task_count}</span> matched tasks
          </p>
        </div>

        {/* Metric 3: Sample & Audit Audit Trail */}
        <div className="rounded-xl border border-white/10 bg-[#131313]/80 p-5">
          <span className="text-[10px] tracking-widest uppercase font-mono text-[#7D7D7D] block">
            Audit Coverage
          </span>
          <div className="mt-2.5 space-y-1.5 text-xs text-[#ADADAD]">
            <div className="flex justify-between">
              <span>Task-Language Pairs:</span>
              <span className="font-mono text-white">{report.sample_count} variants</span>
            </div>
            <div className="flex justify-between">
              <span>Languages Evaluated:</span>
              <span className="font-mono text-white">4 (en, hi, pa, or)</span>
            </div>
            <div className="flex justify-between">
              <span>Dimensions Analyzed:</span>
              <span className="font-mono text-white">5 (14 max pts)</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[#7D7D7D]">
            {report.is_provisional
              ? "Automated provisional scores await native review."
              : "Human reviewed & ground-truth validated."}
          </p>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { ArrowDownRight, ArrowUpRight, HelpCircle } from "lucide-react";
import { ParityGapReport } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";

interface ParityCardProps {
  report: ParityGapReport;
}

export function ParityCard({ report }: ParityCardProps) {
  const gap = report.overall_parity_gap;
  let severityColor = "text-emerald-600 dark:text-emerald-400";
  let severityLabel = "Equitable Parity";

  if (gap >= 4.0) {
    severityColor = "text-rose-600 dark:text-rose-400";
    severityLabel = "Critical Quality Disparity";
  } else if (gap >= 2.0) {
    severityColor = "text-amber-600 dark:text-amber-400";
    severityLabel = "Moderate Language Gap";
  }

  const langNames: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    pa: "Punjabi",
    or: "Odia",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Language Parity Gap
            </h3>
            <span className="cursor-help text-slate-400 hover:text-slate-600" title="Difference between highest and lowest language mean scores across paired tasks.">
              <HelpCircle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Model: <span className="font-mono text-slate-700 dark:text-slate-300">{report.model_id}</span> ({report.provider_name})
          </p>
        </div>
        <div>
          <StatusBadge isProvisional={report.is_provisional} isMock={report.provider_name === "mock"} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Metric 1: Overall Parity Gap */}
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Parity Gap (Max - Min)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold tracking-tight ${severityColor}`}>
              {gap.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500">/ 14.0 pts</span>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            {severityLabel}
          </p>
        </div>

        {/* Metric 2: Highest vs Lowest Language */}
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Range Extremes
          </span>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <ArrowUpRight className="h-3.5 w-3.5" /> High: {langNames[report.highest_language]} ({report.highest_language})
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {report.language_means[report.highest_language]?.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400 font-medium">
                <ArrowDownRight className="h-3.5 w-3.5" /> Low: {langNames[report.lowest_language]} ({report.lowest_language})
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {report.language_means[report.lowest_language]?.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Sample Provenance */}
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Benchmark Audit Scope
          </span>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {report.paired_task_count} Paired Tasks
            </div>
            <p className="text-xs text-slate-500">
              {report.sample_count} Total language responses evaluated
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-blue-50/60 p-3 text-xs text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
        <strong>Important Context:</strong> Parity Gap reflects performance across the 6 curated digital literacy benchmark tasks and should not be generalized as a universal judgment of whole languages.
      </div>
    </div>
  );
}

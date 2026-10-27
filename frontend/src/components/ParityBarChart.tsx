"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ParityGapReport } from "@/types";

interface ParityBarChartProps {
  report: ParityGapReport;
}

export function ParityBarChart({ report }: ParityBarChartProps) {
  const dimensionLabels: Record<string, string> = {
    factual_correctness: "Factual Accuracy (0-4)",
    completeness: "Completeness (0-4)",
    instruction_adherence: "Adherence (0-2)",
    language_naturalness: "Naturalness (0-2)",
    safety_appropriateness: "Safety (0-2)",
  };

  const chartData = Object.entries(report.dimensional_gaps).map(([dimKey, dimData]) => {
    return {
      dimension: dimensionLabels[dimKey] || dimKey,
      gap: dimData.gap,
      // Calculate individual language means for this dimension if available
      [dimData.max_language]: dimData.max_mean,
      [dimData.min_language]: dimData.min_mean,
    };
  });

  // Overall language means chart data
  const overallData = [
    { language: "English (en)", score: report.language_means.en || 0, fill: "#2563eb" },
    { language: "Hindi (hi)", score: report.language_means.hi || 0, fill: "#ea580c" },
    { language: "Punjabi (pa)", score: report.language_means.pa || 0, fill: "#9333ea" },
    { language: "Odia (or)", score: report.language_means.or || 0, fill: "#0d9488" },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Chart 1: Mean Composite Score by Language */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Cross-Lingual Mean Score (0 - 14 scale)
        </h4>
        <p className="text-xs text-slate-500 mb-4">
          Composite average of all 5 dimensions across paired tasks
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overallData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, 14]} tickCount={8} />
              <YAxis type="category" dataKey="language" tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: unknown) => [`${Number(value).toFixed(2)} pts`, "Mean Score"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
              <Bar dataKey="score" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Dimensional Parity Gaps */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Dimensional Parity Gaps (Max - Min disparity)
        </h4>
        <p className="text-xs text-slate-500 mb-4">
          Shows where quality divergence is most pronounced
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="dimension" angle={-15} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 4]} />
              <Tooltip
                formatter={(value: unknown) => [`${Number(value).toFixed(2)} pts disparity`, "Parity Gap"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
              <Bar dataKey="gap" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Gap Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

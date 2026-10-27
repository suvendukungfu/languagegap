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
  Cell,
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
      maxLang: dimData.max_language,
      minLang: dimData.min_language,
      maxMean: dimData.max_mean,
      minMean: dimData.min_mean,
    };
  });

  // Overall language means chart data
  const overallData = [
    { language: "English (en)", code: "en", score: report.language_means.en || 0, fill: "#2D4059" },
    { language: "Hindi (hi)", code: "hi", score: report.language_means.hi || 0, fill: "#B35B43" },
    { language: "Punjabi (pa)", code: "pa", score: report.language_means.pa || 0, fill: "#6E775F" },
    { language: "Odia (or)", code: "or", score: report.language_means.or || 0, fill: "#C79D4C" },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Chart 1: Mean Composite Score by Language */}
      <div className="rounded-2xl border border-[#DDD6C8] bg-[#FCFAF6] p-6 shadow-xs dark:border-[#36332C] dark:bg-[#1F1D19]">
        <div className="border-b border-[#E8E2D5] pb-3 mb-4 dark:border-[#2D2A24]">
          <span className="specimen-tag text-[9px] font-bold text-[#2D4059] dark:text-[#6F8CB0] block">
            FIGURE 01 &bull; AGGREGATE PARITY
          </span>
          <h4 className="font-editorial-serif text-base font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">
            Cross-Lingual Mean Score (0 - 14 scale)
          </h4>
          <p className="text-xs text-[#7A7468] dark:text-[#8C8577]">
            Average composite score across all 5 evaluation dimensions
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overallData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 2" horizontal={false} stroke="#E8E2D5" />
              <XAxis type="number" domain={[0, 14]} tickCount={8} tick={{ fontSize: 11, fill: "#7A7468" }} />
              <YAxis dataKey="language" type="category" tick={{ fontSize: 11, fill: "#1F1E1A" }} width={80} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-[#DDD6C8] bg-[#FCFAF6] p-2.5 shadow-sm text-xs font-sans dark:border-[#36332C] dark:bg-[#1F1D19]">
                        <p className="font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">{data.language}</p>
                        <p className="mt-1 font-mono text-[#B35B43]">Score: {data.score.toFixed(2)} / 14.0 pts</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {overallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Dimensional Parity Gaps */}
      <div className="rounded-2xl border border-[#DDD6C8] bg-[#FCFAF6] p-6 shadow-xs dark:border-[#36332C] dark:bg-[#1F1D19]">
        <div className="border-b border-[#E8E2D5] pb-3 mb-4 dark:border-[#2D2A24]">
          <span className="specimen-tag text-[9px] font-bold text-[#B35B43] dark:text-[#D9785F] block">
            FIGURE 02 &bull; DISPARITY DECOMPOSITION
          </span>
          <h4 className="font-editorial-serif text-base font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">
            Dimensional Disparity Spread (Max - Min)
          </h4>
          <p className="text-xs text-[#7A7468] dark:text-[#8C8577]">
            Score spread across the 5 rubric dimensions
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#E8E2D5" />
              <XAxis
                dataKey="dimension"
                tick={{ fontSize: 10, fill: "#7A7468" }}
                angle={-15}
                textAnchor="end"
                interval={0}
              />
              <YAxis domain={[0, 4]} tick={{ fontSize: 11, fill: "#7A7468" }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-[#DDD6C8] bg-[#FCFAF6] p-2.5 shadow-sm text-xs font-sans dark:border-[#36332C] dark:bg-[#1F1D19]">
                        <p className="font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">{data.dimension}</p>
                        <p className="mt-1 font-mono text-[#B35B43]">Disparity Gap: {data.gap.toFixed(2)} pts</p>
                        <p className="text-[11px] text-[#7A7468]">
                          High: {data.maxLang} ({data.maxMean.toFixed(1)}) &bull; Low: {data.minLang} ({data.minMean.toFixed(1)})
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="gap" fill="#B35B43" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

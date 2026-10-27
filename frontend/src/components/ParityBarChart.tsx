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

  // Overall language means chart data - Shipcraft warm amber and dark palette
  const overallData = [
    { language: "English (en)", code: "en", score: report.language_means.en || 0, fill: "#F0A24C" },
    { language: "Hindi (hi)", code: "hi", score: report.language_means.hi || 0, fill: "#E0A165" },
    { language: "Punjabi (pa)", code: "pa", score: report.language_means.pa || 0, fill: "#C88B52" },
    { language: "Odia (or)", code: "or", score: report.language_means.or || 0, fill: "#8A5A30" },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Chart 1: Mean Composite Score by Language */}
      <div className="rounded-2xl border border-white/10 bg-[#1D1D1D]/70 p-6 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <div className="border-b border-white/10 pb-3 mb-4">
          <span className="text-[10px] tracking-widest uppercase font-mono text-[#F0A24C] block mb-1">
            FIGURE 01 • AGGREGATE PERFORMANCE
          </span>
          <h4 className="text-base font-normal text-white">
            Cross-Lingual Mean Score (0 - 14 scale)
          </h4>
          <p className="text-xs text-[#7D7D7D] mt-0.5">
            Average composite score across all 5 evaluation dimensions
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overallData} layout="vertical" margin={{ top: 5, right: 30, left: 45, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255, 255, 255, 0.06)" />
              <XAxis type="number" domain={[0, 14]} tickCount={8} tick={{ fontSize: 11, fill: "#7D7D7D" }} />
              <YAxis dataKey="language" type="category" tick={{ fontSize: 11, fill: "#ADADAD" }} width={85} />
              <Tooltip
                cursor={{ fill: "rgba(240, 162, 76, 0.05)" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-[#F0A24C]/40 bg-[#131313]/95 p-3 shadow-xl text-xs backdrop-blur-md">
                        <p className="font-medium text-white">{data.language}</p>
                        <p className="mt-1 font-mono text-[#F0A24C]">Score: {data.score.toFixed(2)} / 14.0 pts</p>
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
      <div className="rounded-2xl border border-white/10 bg-[#1D1D1D]/70 p-6 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <div className="border-b border-white/10 pb-3 mb-4">
          <span className="text-[10px] tracking-widest uppercase font-mono text-[#F0A24C] block mb-1">
            FIGURE 02 • DISPARITY DECOMPOSITION
          </span>
          <h4 className="text-base font-normal text-white">
            Dimensional Parity Gaps (Max − Min)
          </h4>
          <p className="text-xs text-[#7D7D7D] mt-0.5">
            Difference between highest and lowest language scores per dimension
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.06)" />
              <XAxis
                dataKey="dimension"
                tick={{ fontSize: 10, fill: "#7D7D7D" }}
                angle={-20}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: "#7D7D7D" }} domain={[0, "auto"]} />
              <Tooltip
                cursor={{ fill: "rgba(240, 162, 76, 0.05)" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-[#F0A24C]/40 bg-[#131313]/95 p-3 shadow-xl text-xs backdrop-blur-md">
                        <p className="font-medium text-white">{data.dimension}</p>
                        <p className="mt-1 font-mono text-[#F0A24C]">Parity Gap: Δ {data.gap.toFixed(2)} pts</p>
                        <div className="mt-2 space-y-0.5 text-[11px] text-[#ADADAD]">
                          <p>High: <span className="text-white font-mono">{data.maxLang?.toUpperCase()}</span> ({data.maxMean?.toFixed(2)})</p>
                          <p>Low: <span className="text-[#F0A24C] font-mono">{data.minLang?.toUpperCase()}</span> ({data.minMean?.toFixed(2)})</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="gap" fill="#F0A24C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

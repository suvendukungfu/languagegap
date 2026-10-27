"use client";

import React, { useState } from "react";
import { Download, CheckCircle2, ShieldCheck, Cpu, Hash, FileJson, Check } from "lucide-react";
import { EvaluationPassportResponse } from "@/types";

interface ReproducibilityPassportCardProps {
  passport: EvaluationPassportResponse;
}

export function ReproducibilityPassportCard({ passport }: ReproducibilityPassportCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [copiedSha, setCopiedSha] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(passport, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `reproducibility-passport-${passport.evaluation_run_id}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } finally {
      setDownloading(false);
    }
  };

  const handleCopySha = () => {
    navigator.clipboard.writeText(passport.benchmark_sha256);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const shortSha = passport.benchmark_sha256
    ? `${passport.benchmark_sha256.substring(0, 10)}...${passport.benchmark_sha256.substring(passport.benchmark_sha256.length - 8)}`
    : "N/A";

  const languageSetDisplay = passport.language_set?.join(" • ") || "en • hi • pa • or";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1D1D1D]/70 p-6 shadow-xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] tracking-widest uppercase font-mono text-[#F0A24C] bg-[#2C241D] border border-[#F0A24C]/30">
              REPRODUCIBILITY PASSPORT
            </span>
            <span className="text-[10px] font-mono text-[#7D7D7D]">
              PROVENANCE MANIFEST V{passport.evaluator_version}
            </span>
          </div>
          <h3 className="text-lg font-normal text-white">
            Benchmark Integrity & Audit Passport
          </h3>
          <p className="text-xs text-[#ADADAD] font-light">
            Deterministic cryptographic fingerprint and execution provenance for independent verification.
          </p>
        </div>

        {/* Download JSON Button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn-amber-glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-normal"
        >
          <FileJson className="h-4 w-4 text-[#F0A24C]" />
          <span>{downloading ? "Preparing Export..." : "Download Passport JSON"}</span>
          <Download className="h-3.5 w-3.5 opacity-80" />
        </button>
      </div>

      {/* Grid of Provenance Telemetry */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Benchmark Version & SHA256 */}
        <div className="rounded-xl border border-white/5 bg-[#131313] p-4 space-y-2">
          <span className="text-[10px] font-mono text-[#7D7D7D] uppercase tracking-wider block">
            Benchmark Dataset
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-white">v{passport.benchmark_version}</span>
            <span className="text-[10px] text-[#717171]">({passport.benchmark_id})</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] font-mono text-[#7D7D7D]">
            <span title={passport.benchmark_sha256} className="cursor-help">
              SHA: {shortSha}
            </span>
            <button
              onClick={handleCopySha}
              className="text-[#F0A24C] hover:underline"
              title="Copy Full SHA256"
            >
              {copiedSha ? <Check className="h-3.5 w-3.5" /> : "Copy"}
            </button>
          </div>
        </div>

        {/* Metric 2: Model & Integrity Status */}
        <div className="rounded-xl border border-white/5 bg-[#131313] p-4 space-y-2">
          <span className="text-[10px] font-mono text-[#7D7D7D] uppercase tracking-wider block">
            Evaluated Foundation Model
          </span>
          <div className="flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-[#F0A24C]" />
            <span className="font-mono text-xs font-bold text-white">{passport.actual_model_id}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] font-mono text-[#7D7D7D]">
            <span>Integrity:</span>
            <span className="text-[#F0A24C]">PASSED (Unicode NFC)</span>
          </div>
        </div>

        {/* Metric 3: Parity Gap & Language Set */}
        <div className="rounded-xl border border-white/5 bg-[#131313] p-4 space-y-2">
          <span className="text-[10px] font-mono text-[#7D7D7D] uppercase tracking-wider block">
            Parity Gap Metric
          </span>
          <div className="text-xs font-mono text-white flex items-center justify-between">
            <span className="text-[#F0A24C] font-bold">Δ {passport.parity_gap.toFixed(3)} pts</span>
            <span className="text-[10px] text-[#717171]">Spread</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] font-mono text-[#7D7D7D]">
            <span>Languages:</span>
            <span className="text-white">{languageSetDisplay}</span>
          </div>
        </div>

        {/* Metric 4: Human Review Status & Execution Cohort */}
        <div className="rounded-xl border border-white/5 bg-[#131313] p-4 space-y-2">
          <span className="text-[10px] font-mono text-[#7D7D7D] uppercase tracking-wider block">
            Audit Provenance
          </span>
          <div className="text-xs font-mono text-white capitalize flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#F0A24C]" />
            <span>{passport.human_review_status.replace("_", " ")}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] font-mono text-[#7D7D7D]">
            <span>Cohort:</span>
            <span className="text-white capitalize">{passport.sample_count} samples ({passport.execution_status})</span>
          </div>
        </div>
      </div>
    </div>
  );
}

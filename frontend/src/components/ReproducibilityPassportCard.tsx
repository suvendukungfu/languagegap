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

  return (
    <div className="rounded-2xl border border-[#DDD6C8] bg-[#FCFAF6] p-6 shadow-xs dark:border-[#36332C] dark:bg-[#1F1D19]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E2D5] pb-4 dark:border-[#2D2A24]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="archival-stamp rounded px-1.5 py-0.5 text-[9px] text-[#2D4059] border-[#2D4059] dark:text-[#6F8CB0] dark:border-[#6F8CB0]">
              REPRODUCIBILITY PASSPORT
            </span>
            <span className="specimen-tag text-[10px] text-[#7A7468]">
              PROVENANCE MANIFEST V{passport.evaluator_version}
            </span>
          </div>
          <h3 className="font-editorial-serif text-lg font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">
            Benchmark Integrity & Audit Passport
          </h3>
          <p className="text-xs text-[#7A7468] dark:text-[#8C8577]">
            Deterministic cryptographic fingerprint and execution provenance for independent verification.
          </p>
        </div>

        {/* Download JSON Button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#2D4059] bg-[#2D4059] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#1E2B3C] active:scale-[0.98] dark:border-[#6F8CB0] dark:bg-[#6F8CB0] dark:text-[#171614] dark:hover:bg-[#85A2C6]"
        >
          <FileJson className="h-4 w-4 text-[#DFB768]" />
          <span>{downloading ? "Preparing Export..." : "Download Passport JSON"}</span>
          <Download className="h-3.5 w-3.5 opacity-80" />
        </button>
      </div>

      {/* Grid of Provenance Telemetry */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Benchmark Version & SHA256 */}
        <div className="rounded-xl border border-[#E8E2D5] bg-[#F6F2E9] p-3.5 dark:border-[#2D2A24] dark:bg-[#171614]">
          <span className="specimen-tag text-[9px] text-[#7A7468] block mb-1">
            BENCHMARK FINGERPRINT
          </span>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">
              v{passport.benchmark_version}
            </span>
            <button
              onClick={handleCopySha}
              title={`Full SHA-256: ${passport.benchmark_sha256}\nClick to copy`}
              className="inline-flex items-center gap-1 font-mono text-[10px] text-[#2D4059] hover:underline dark:text-[#6F8CB0]"
            >
              <Hash className="h-3 w-3" />
              <span>{shortSha}</span>
              {copiedSha ? <Check className="h-2.5 w-2.5 text-emerald-600" /> : null}
            </button>
          </div>
          <span className="text-[10px] text-[#7A7468] mt-1 block">
            ID: <strong className="font-mono">{passport.benchmark_id}</strong>
          </span>
        </div>

        {/* Metric 2: Provider & Model Identity */}
        <div className="rounded-xl border border-[#E8E2D5] bg-[#F6F2E9] p-3.5 dark:border-[#2D2A24] dark:bg-[#171614]">
          <span className="specimen-tag text-[9px] text-[#7A7468] block mb-1">
            INFERENCE RUNTIME
          </span>
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-[#B35B43]" />
            <span className="font-mono text-xs font-bold text-[#1F1E1A] dark:text-[#EDE8DC] truncate">
              {passport.actual_model_id}
            </span>
          </div>
          <span className="text-[10px] text-[#7A7468] mt-1 block">
            Provider: <strong className="capitalize">{passport.provider_id}</strong>
            {passport.is_mock_provider ? " (Deterministic Mock)" : " (Live Inference)"}
          </span>
        </div>

        {/* Metric 3: Integrity & Language Coverage */}
        <div className="rounded-xl border border-[#E8E2D5] bg-[#F6F2E9] p-3.5 dark:border-[#2D2A24] dark:bg-[#171614]">
          <span className="specimen-tag text-[9px] text-[#7A7468] block mb-1">
            INTEGRITY & COVERAGE
          </span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {passport.benchmark_integrity.valid ? "PASSED (Unicode NFC)" : "INTEGRITY WARNING"}
            </span>
          </div>
          <span className="text-[10px] text-[#7A7468] mt-1 block">
            Languages: <strong className="font-mono">{passport.language_set.join(" • ")}</strong> ({passport.task_count} paired tasks)
          </span>
        </div>

        {/* Metric 4: Parity Gap & Audit Status */}
        <div className="rounded-xl border border-[#E8E2D5] bg-[#F6F2E9] p-3.5 dark:border-[#2D2A24] dark:bg-[#171614]">
          <span className="specimen-tag text-[9px] text-[#7A7468] block mb-1">
            PARITY GAP & HUMAN AUDIT
          </span>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#B35B43]">
              &Delta; {passport.parity_gap.toFixed(3)}
            </span>
            <span className="rounded bg-[#FAECE8] px-1.5 py-0.5 text-[9px] font-semibold capitalize text-[#B35B43] dark:bg-[#2D1B17] dark:text-[#D9785F]">
              {passport.human_review_status.replace("_", " ")}
            </span>
          </div>
          <span className="text-[10px] text-[#7A7468] mt-1 block">
            {passport.human_review_count} reviewer overrides logged
          </span>
        </div>
      </div>
    </div>
  );
}

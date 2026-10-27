"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, Layers, RefreshCw } from "lucide-react";
import { DimensionScores, EvaluationDetailResponse, EvaluationPassportResponse, ParityGapReport } from "@/types";
import { getEvaluation, getEvaluationPassport, getEvaluationReport } from "@/lib/api";
import { ParityCard } from "@/components/ParityCard";
import { ParityBarChart } from "@/components/ParityBarChart";
import { LanguageComparisonMatrix } from "@/components/LanguageComparisonMatrix";
import { StatusBadge } from "@/components/StatusBadge";
import { ReproducibilityPassportCard } from "@/components/ReproducibilityPassportCard";

function EvaluationDetailContent() {
  const params = useParams();
  const evaluationId = params?.id as string;

  const [detail, setDetail] = useState<EvaluationDetailResponse | null>(null);
  const [report, setReport] = useState<ParityGapReport | null>(null);
  const [passport, setPassport] = useState<EvaluationPassportResponse | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRefresh = () => {
    if (!evaluationId) return;
    setLoading(true);
    setErrorMsg(null);
    getEvaluation(evaluationId)
      .then(async (data) => {
        setDetail(data);
        if (data.responses.length > 0) {
          const taskIds = Array.from(new Set(data.responses.map((r) => r.task_id)));
          if (taskIds.length > 0) {
            setSelectedTaskId((prev) => prev || taskIds[0]);
          }
        }
        try {
          const rep = await getEvaluationReport(evaluationId);
          setReport(rep);
        } catch {
          // Report not available yet
        }
        try {
          const pass = await getEvaluationPassport(evaluationId);
          setPassport(pass);
        } catch {
          // Passport not available yet
        }
      })
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : "Failed to load evaluation details");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!evaluationId) return;
    let ignore = false;
    getEvaluation(evaluationId)
      .then(async (data) => {
        if (ignore) return;
        setDetail(data);

        if (data.responses.length > 0) {
          const taskIds = Array.from(new Set(data.responses.map((r) => r.task_id)));
          if (taskIds.length > 0) {
            setSelectedTaskId((prev) => prev || taskIds[0]);
          }
        }

        try {
          const rep = await getEvaluationReport(evaluationId);
          if (!ignore) setReport(rep);
        } catch {
          // Report not available yet
        }

        try {
          const pass = await getEvaluationPassport(evaluationId);
          if (!ignore) setPassport(pass);
        } catch {
          // Passport not available yet
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setErrorMsg(err instanceof Error ? err.message : "Failed to load evaluation details");
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [evaluationId]);

  const handleReviewUpdated = (responseId: string, updatedScores: DimensionScores) => {
    if (!detail) return;
    const updatedResponses = detail.responses.map((r) => {
      if (r.id === responseId) {
        return {
          ...r,
          dimension_scores: updatedScores,
          is_provisional: false,
          evaluation_method: "human_validated",
        };
      }
      return r;
    });
    setDetail({
      ...detail,
      responses: updatedResponses,
    });

    // Refresh parity report and passport to reflect updated human score
    getEvaluationReport(evaluationId)
      .then((rep) => setReport(rep))
      .catch(() => {});
    getEvaluationPassport(evaluationId)
      .then((pass) => setPassport(pass))
      .catch(() => {});
  };

  if (loading && !detail) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center text-[#7A7468]">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#B35B43] mb-3" />
        <p className="font-editorial-serif text-lg font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">
          Loading Archival Evaluation Records...
        </p>
        <p className="text-xs text-[#7A7468] mt-1">Fetching response cohorts and parity metrics from SQLite repository</p>
      </div>
    );
  }

  if (errorMsg || !detail) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-2xl border border-[#E5B5A7] bg-[#FAECE8] p-8 text-[#9E4A34] dark:border-[#52291E] dark:bg-[#2D1B17] dark:text-[#E5A394]">
          <h2 className="font-editorial-serif text-xl font-bold">Failed to Load Evaluation Run</h2>
          <p className="mt-1 text-xs">{errorMsg || "The requested evaluation run could not be found."}</p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#B35B43] underline hover:text-[#9E4A34]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return to Exhibition Overview
          </Link>
        </div>
      </div>
    );
  }

  const taskIds = Array.from(new Set(detail.responses.map((r) => r.task_id)));
  const currentTaskResponses = detail.responses.filter((r) => r.task_id === selectedTaskId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Top Header / Breadcrumb */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A7468] hover:text-[#1F1E1A] dark:hover:text-[#EDE8DC] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Exhibition Overview
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-b border-[#DDD6C8] pb-6 dark:border-[#36332C]">
          <div>
            <div className="flex items-center gap-2">
              <span className="archival-stamp rounded px-1.5 py-0.5 text-[9px] text-[#2D4059] border-[#2D4059] dark:text-[#6F8CB0] dark:border-[#6F8CB0]">
                EVALUATION ARCHIVE
              </span>
              <span className="specimen-tag text-xs font-mono text-[#7A7468]">
                RUN: {detail.run.id}
              </span>
            </div>
            <h1 className="mt-1 font-editorial-serif text-3xl font-bold tracking-tight text-[#1F1E1A] dark:text-[#EDE8DC] sm:text-4xl">
              Cross-Lingual Evaluation Matrix
            </h1>
            <p className="mt-1 text-xs text-[#7A7468] dark:text-[#8C8577]">
              Model: <span className="font-mono font-medium text-[#1F1E1A] dark:text-[#EDE8DC]">{detail.run.model_id}</span> ({detail.run.provider_name}) &bull; Recorded: {new Date(detail.run.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge
              isProvisional={report ? report.is_provisional : true}
              isMock={detail.run.provider_name === "mock"}
            />
            <button
              onClick={handleRefresh}
              className="rounded-lg border border-[#DDD6C8] bg-[#FCFAF6] p-2 text-[#7A7468] hover:bg-[#F6F2E9] hover:text-[#1F1E1A] dark:border-[#36332C] dark:bg-[#1F1D19] dark:hover:bg-[#2A2822] transition-colors"
              title="Refresh results"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Reproducibility Passport & Provenance Manifest */}
      {passport && <ReproducibilityPassportCard passport={passport} />}

      {/* Parity Report Card */}
      {report && <ParityCard report={report} />}

      {/* Task Tabs Navigation */}
      <div className="rounded-2xl border border-[#DDD6C8] bg-[#FCFAF6] p-6 shadow-xs dark:border-[#36332C] dark:bg-[#1F1D19]">
        <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-3.5 dark:border-[#2D2A24]">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#B35B43]" />
            <h3 className="font-editorial-serif text-base font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">
              Matched Task Group Exhibition
            </h3>
          </div>
          <span className="specimen-tag text-[10px] text-[#7A7468] dark:text-[#8C8577]">
            {taskIds.length} Curated Tasks &bull; 4 Scripts
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {taskIds.map((tid) => {
            const isSelected = tid === selectedTaskId;
            return (
              <button
                key={tid}
                onClick={() => setSelectedTaskId(tid)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-mono font-medium transition-all ${
                  isSelected
                    ? "border border-[#B35B43] bg-[#FAECE8] text-[#B35B43] shadow-xs dark:border-[#D9785F] dark:bg-[#2D1B17] dark:text-[#D9785F]"
                    : "border border-[#DDD6C8] bg-[#F6F2E9] text-[#5E594F] hover:bg-[#EFE9DC] hover:text-[#1F1E1A] dark:border-[#36332C] dark:bg-[#171614] dark:text-[#A69F91]"
                }`}
              >
                {tid}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4-Way Language Comparison Matrix */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="specimen-tag text-[9px] font-bold text-[#2D4059] dark:text-[#6F8CB0] block">
              PARALLEL LANGUAGE SPECIMENS
            </span>
            <h3 className="font-editorial-serif text-xl font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">
              Four-Language Response Audit: <span className="font-mono text-base font-normal text-[#B35B43]">{selectedTaskId}</span>
            </h3>
          </div>
          <span className="text-xs text-[#7A7468] hidden sm:inline">
            Side-by-side linguistic comparison across English, Hindi, Punjabi, and Odia
          </span>
        </div>

        <LanguageComparisonMatrix
          responses={currentTaskResponses}
          onReviewUpdated={handleReviewUpdated}
        />
      </div>

      {/* Graphical Parity Analysis */}
      {report && (
        <div className="pt-4 border-t border-[#DDD6C8] dark:border-[#36332C]">
          <div className="mb-4">
            <span className="specimen-tag text-[9px] font-bold text-[#2D4059] dark:text-[#6F8CB0] block">
              ANALYTICAL TELEMETRY
            </span>
            <h3 className="font-editorial-serif text-xl font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">
              Disparity Visualizations & Dimensional Decomposition
            </h3>
          </div>
          <ParityBarChart report={report} />
        </div>
      )}
    </div>
  );
}

export default function EvaluationDetailPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-24 text-center text-[#7A7468]">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#B35B43] mb-3" />
        <p className="font-editorial-serif text-lg font-bold text-[#1F1E1A]">Loading Evaluation...</p>
      </div>
    }>
      <EvaluationDetailContent />
    </Suspense>
  );
}

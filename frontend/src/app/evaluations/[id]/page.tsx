"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, Layers, RefreshCw } from "lucide-react";
import { DimensionScores, EvaluationDetailResponse, ParityGapReport } from "@/types";
import { getEvaluation, getEvaluationReport } from "@/lib/api";
import { ParityCard } from "@/components/ParityCard";
import { ParityBarChart } from "@/components/ParityBarChart";
import { LanguageComparisonMatrix } from "@/components/LanguageComparisonMatrix";
import { StatusBadge } from "@/components/StatusBadge";

function EvaluationDetailContent() {
  const params = useParams();
  const evaluationId = params?.id as string;

  const [detail, setDetail] = useState<EvaluationDetailResponse | null>(null);
  const [report, setReport] = useState<ParityGapReport | null>(null);
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

    // Refresh parity report to reflect updated human score
    getEvaluationReport(evaluationId)
      .then((rep) => setReport(rep))
      .catch(() => {});
  };

  if (loading && !detail) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-500">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Loading evaluation run data and parity report...</p>
      </div>
    );
  }

  if (errorMsg || !detail) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          <h2 className="text-base font-bold">Failed to Load Evaluation</h2>
          <p className="mt-1 text-xs">{errorMsg || "Evaluation run not found."}</p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 underline dark:text-rose-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return to Overview
          </Link>
        </div>
      </div>
    );
  }

  const taskIds = Array.from(new Set(detail.responses.map((r) => r.task_id)));
  const currentTaskResponses = detail.responses.filter((r) => r.task_id === selectedTaskId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Top Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Overview
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Multilingual Language Parity Comparison
            </h1>
            <p className="mt-1 text-xs font-mono text-slate-500">
              Run ID: {detail.run.id} &bull; Model: {detail.run.model_id} ({detail.run.provider_name})
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge
              isProvisional={report ? report.is_provisional : true}
              isMock={detail.run.provider_name === "mock"}
            />
            <button
              onClick={handleRefresh}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
              title="Refresh results"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Parity Report Card */}
      {report && <ParityCard report={report} />}

      {/* Task Tabs Navigation */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Select Task Group
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {taskIds.length} benchmark task sets
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {taskIds.map((tid) => {
            const isSelected = tid === selectedTaskId;
            return (
              <button
                key={tid}
                onClick={() => setSelectedTaskId(tid)}
                className={`rounded-lg px-3 py-1.5 text-xs font-mono font-medium transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {tid}
              </button>
            );
          })}
        </div>

        {/* Selected Task Canonical Prompt Context */}
        {currentTaskResponses.length > 0 && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Canonical Question Intent
            </span>
            <p className="mt-1 text-xs text-slate-800 dark:text-slate-200 font-medium">
              &ldquo;{currentTaskResponses[0].prompt}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* 4-Way Language Comparison Matrix */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Side-by-Side Multilingual Evaluation Matrix
          </h3>
          <span className="text-xs text-slate-500">
            English, Hindi, Punjabi, Odia
          </span>
        </div>
        <LanguageComparisonMatrix
          responses={currentTaskResponses}
          onReviewUpdated={handleReviewUpdated}
        />
      </div>

      {/* Dimensional Parity Bar Charts */}
      {report && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Cross-Lingual Quality Breakdown
          </h3>
          <ParityBarChart report={report} />
        </div>
      )}
    </div>
  );
}

export default function EvaluationDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-500">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm">Loading evaluation run data...</p>
        </div>
      }
    >
      <EvaluationDetailContent />
    </Suspense>
  );
}

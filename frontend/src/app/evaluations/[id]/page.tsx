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
      <div className="mx-auto max-w-7xl px-4 py-32 text-center text-[#7D7D7D]">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#F0A24C] mb-3" />
        <p className="text-lg font-light text-white">
          Loading Archival Evaluation Records...
        </p>
        <p className="text-xs text-[#717171] mt-1">Fetching response cohorts and parity metrics from SQLite repository</p>
      </div>
    );
  }

  if (errorMsg || !detail) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24">
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-8 text-red-200">
          <h2 className="text-xl font-normal text-white">Failed to Load Evaluation Run</h2>
          <p className="mt-1 text-xs text-red-300">{errorMsg || "The requested evaluation run could not be found."}</p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#F0A24C] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return to Research Overview
          </Link>
        </div>
      </div>
    );
  }

  const taskIds = Array.from(new Set(detail.responses.map((r) => r.task_id)));
  const currentTaskResponses = detail.responses.filter((r) => r.task_id === selectedTaskId);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#ADADAD] pt-24 pb-20 selection:bg-[#F0A24C]/25 selection:text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
        {/* Top Header / Breadcrumb */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#7D7D7D] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Research Overview
          </Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] tracking-widest uppercase font-mono text-[#F0A24C] bg-[#2C241D] border border-[#F0A24C]/30">
                  EVALUATION ARCHIVE
                </span>
                <span className="text-xs font-mono text-[#7D7D7D]">
                  RUN: {detail.run.id}
                </span>
              </div>
              <h1 className="mt-2 text-3xl sm:text-4xl font-light tracking-tight text-white">
                Cross-Lingual Evaluation Matrix
              </h1>
              <p className="mt-1 text-xs text-[#7D7D7D]">
                Model: <span className="font-mono text-white">{detail.run.model_id}</span> ({detail.run.provider_name}) • Recorded: {new Date(detail.run.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge
                isProvisional={report ? report.is_provisional : true}
                isMock={detail.run.provider_name === "mock"}
              />
              <button
                onClick={handleRefresh}
                className="btn-secondary-glass rounded-full p-2.5 text-[#ADADAD] hover:text-white"
                title="Refresh results"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#F0A24C]" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Reproducibility Passport & Provenance Manifest */}
        {passport && <ReproducibilityPassportCard passport={passport} />}

        {/* Parity Report Card */}
        {report && <ParityCard report={report} />}

        {/* Task Tabs Navigation */}
        <div className="rounded-2xl border border-white/10 bg-[#1D1D1D]/70 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#F0A24C]" />
              <h3 className="text-base font-normal text-white">
                Matched Task Group Exhibition
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#7D7D7D]">
              {taskIds.length} Curated Tasks • 4 Scripts
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {taskIds.map((tid) => {
              const isSelected = tid === selectedTaskId;
              return (
                <button
                  key={tid}
                  onClick={() => setSelectedTaskId(tid)}
                  className={`rounded-full px-4 py-1.5 text-xs font-mono transition-all ${
                    isSelected
                      ? "border border-[#F0A24C]/60 bg-[#2C241D] text-[#F0A24C] shadow-sm"
                      : "border border-white/10 bg-[#131313] text-[#7D7D7D] hover:text-white"
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
              <span className="text-[10px] font-mono text-[#F0A24C] block mb-1">
                PARALLEL LANGUAGE SPECIMENS
              </span>
              <h3 className="text-xl font-normal text-white">
                Four-Language Response Audit: <span className="font-mono text-base text-[#F0A24C]">{selectedTaskId}</span>
              </h3>
            </div>
            <span className="text-xs text-[#7D7D7D] hidden sm:inline font-light">
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
          <div className="pt-4 border-t border-white/10">
            <div className="mb-6">
              <span className="text-[10px] font-mono text-[#F0A24C] block mb-1">
                ANALYTICAL TELEMETRY
              </span>
              <h3 className="text-xl font-normal text-white">
                Disparity Visualizations & Dimensional Decomposition
              </h3>
            </div>
            <ParityBarChart report={report} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function EvaluationDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center text-center text-[#7D7D7D]">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#F0A24C] mb-3" />
        <p className="text-lg font-light text-white">Loading Evaluation...</p>
      </div>
    }>
      <EvaluationDetailContent />
    </Suspense>
  );
}

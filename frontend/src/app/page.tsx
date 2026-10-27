"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart2, Play, RefreshCw, Sparkles } from "lucide-react";
import { EvaluationSummary, ParityGapReport } from "@/types";
import { getEvaluationReport, listEvaluations } from "@/lib/api";
import { ParityCard } from "@/components/ParityCard";
import { ParityBarChart } from "@/components/ParityBarChart";

export default function OverviewPage() {
  const [runs, setRuns] = useState<EvaluationSummary[]>([]);
  const [latestReport, setLatestReport] = useState<ParityGapReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    listEvaluations()
      .then(async (evaluationRuns) => {
        setRuns(evaluationRuns);
        const completedRun = evaluationRuns.find((r) => r.status === "completed" && r.response_count > 0);
        if (completedRun) {
          try {
            const rep = await getEvaluationReport(completedRun.id);
            setLatestReport(rep);
          } catch {
            // report not ready
          }
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to connect to LanguageGap backend API");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    listEvaluations()
      .then(async (evaluationRuns) => {
        if (ignore) return;
        setRuns(evaluationRuns);

        const completedRun = evaluationRuns.find((r) => r.status === "completed" && r.response_count > 0);
        if (completedRun) {
          try {
            const rep = await getEvaluationReport(completedRun.id);
            if (!ignore) setLatestReport(rep);
          } catch {
            // report not ready
          }
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to connect to LanguageGap backend API");
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
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero Section */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 text-white shadow-xl dark:border-slate-800">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-400/20">
            <Sparkles className="h-3.5 w-3.5" />
            Gemma 4 Language Parity Research
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Same question. Different languages.
            <span className="block text-blue-400">Equal opportunity to understand.</span>
          </h1>
          <p className="mt-4 text-sm text-slate-300 sm:text-base leading-relaxed">
            LanguageGap evaluates whether Gemma 4 provides equally accurate, complete, and understandable answers across
            English, Hindi, Punjabi, and Odia for foundational digital literacy and societal technology questions.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href="/evaluate"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-500"
            >
              <Play className="h-4 w-4" />
              Start New Evaluation
            </Link>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          <strong>Backend Connection Error:</strong> {error}. Ensure your backend server is running at <code className="font-mono">http://localhost:8000</code>.
        </div>
      )}

      {/* Latest Evaluation Parity Report Section */}
      {latestReport && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Latest Benchmark Parity Report
            </h2>
            <Link
              href={`/evaluations/${runs[0]?.id}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              View 4-Way Comparison Matrix <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ParityCard report={latestReport} />
          <ParityBarChart report={latestReport} />
        </div>
      )}

      {/* Evaluations Run History Table */}
      <div className="mt-10 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Evaluation Run History
            </h3>
            <p className="text-xs text-slate-500">
              Audit trails and response records stored in SQLite
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {runs.length} Runs Recorded
          </span>
        </div>

        {runs.length === 0 && !loading && (
          <div className="p-12 text-center">
            <BarChart2 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
            <h4 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">
              No evaluations recorded yet
            </h4>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Run an initial evaluation using the deterministic Mock Provider or your live Gemma 4 inference server.
            </p>
            <Link
              href="/evaluate"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Play className="h-3.5 w-3.5" /> Start Evaluation
            </Link>
          </div>
        )}

        {runs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-3">Run ID</th>
                  <th className="px-6 py-3">Provider</th>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">Responses</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-3 font-mono font-medium text-slate-900 dark:text-white">
                      {r.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-3">
                      <span className="capitalize text-slate-700 dark:text-slate-300">{r.provider_name}</span>
                    </td>
                    <td className="px-6 py-3 font-mono text-slate-600 dark:text-slate-400">
                      {r.model_id}
                    </td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                      {r.response_count}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          r.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : r.status === "running"
                            ? "bg-blue-50 text-blue-700 animate-pulse dark:bg-blue-950/40 dark:text-blue-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`/evaluations/${r.id}`}
                        className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
                      >
                        Inspect &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

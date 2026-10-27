"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Play, Settings2, Sparkles } from "lucide-react";
import { BenchmarkSummary } from "@/types";
import { createEvaluation, getBenchmarks, getEvaluation } from "@/lib/api";

export default function EvaluateSetupPage() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkSummary[]>([]);
  const selectedBenchmark = "digital_literacy";
  const [provider, setProvider] = useState<string>("mock");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [temperature, setTemperature] = useState<number>(0.2);
  const [topP, setTopP] = useState<number>(0.95);
  const [maxTokens, setMaxTokens] = useState<number>(1024);

  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string>("pending");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getBenchmarks()
      .then((data) => {
        setBenchmarks(data);
        if (data.length > 0) {
          const defaultTasks = data[0].tasks.map((t) => t.task_id);
          setSelectedTasks(defaultTasks);
        }
      })
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : "Failed to load benchmarks");
      });
  }, []);

  // Poll active run if running
  useEffect(() => {
    if (!activeRunId || runStatus === "completed" || runStatus === "failed") return;

    const interval = setInterval(async () => {
      try {
        const detail = await getEvaluation(activeRunId);
        setRunStatus(detail.run.status);
        if (detail.run.status === "completed") {
          clearInterval(interval);
        }
      } catch {
        // ignore polling errors
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeRunId, runStatus]);

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSelectAllTasks = () => {
    if (benchmarks.length > 0) {
      setSelectedTasks(benchmarks[0].tasks.map((t) => t.task_id));
    }
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTasks.length === 0) {
      setErrorMsg("Please select at least one benchmark task to evaluate.");
      return;
    }

    setIsLaunching(true);
    setErrorMsg(null);
    try {
      const run = await createEvaluation(
        {
          dataset_id: selectedBenchmark,
          provider: provider,
          task_ids: selectedTasks,
          sampling_params: {
            temperature,
            top_p: topP,
            max_tokens: maxTokens,
          },
        },
        false // asynchronous background execution
      );
      setActiveRunId(run.id);
      setRunStatus(run.status);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to start evaluation");
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          New Multilingual Evaluation Run
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Configure benchmark tasks and generation parameters for evaluation across English, Hindi, Punjabi, and Odia.
        </p>
      </div>

      {errorMsg && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {/* Live Run Progress Banner */}
      {activeRunId && (
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/70 p-6 dark:border-blue-900/60 dark:bg-blue-950/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Evaluation In Progress
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                Run ID: <span className="font-mono">{activeRunId}</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Status: <strong className="capitalize">{runStatus}</strong> &bull; Evaluating {selectedTasks.length} tasks across 4 languages
              </p>
            </div>

            <div className="flex items-center gap-3">
              {runStatus === "running" || runStatus === "pending" ? (
                <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  Generating responses...
                </div>
              ) : runStatus === "completed" ? (
                <Link
                  href={`/evaluations/${activeRunId}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-500"
                >
                  <CheckCircle2 className="h-4 w-4" /> View Comparison Matrix &rarr;
                </Link>
              ) : (
                <span className="text-xs text-rose-600 font-semibold">Evaluation Run Failed</span>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleLaunch} className="mt-8 space-y-8">
        {/* Step 1: Provider selection */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            1. Select Inference Provider
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Choose whether to run with the fast offline Mock Provider or the configured live Gemma 4 server.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer flex-col rounded-xl border p-4 transition-all ${
                provider === "mock"
                  ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600 dark:border-blue-500 dark:bg-blue-950/30"
                  : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  Mock Provider
                </span>
                <input
                  type="radio"
                  name="provider"
                  value="mock"
                  checked={provider === "mock"}
                  onChange={() => setProvider("mock")}
                  className="h-4 w-4 text-blue-600"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Deterministic, zero-cost multilingual fixture responses. Ideal for instant demonstrations, unit validation, and testing.
              </p>
              <span className="mt-3 inline-block rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 w-fit dark:bg-purple-950 dark:text-purple-300">
                Illustrative Fixture Data
              </span>
            </label>

            <label
              className={`flex cursor-pointer flex-col rounded-xl border p-4 transition-all ${
                provider === "gemma"
                  ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600 dark:border-blue-500 dark:bg-blue-950/30"
                  : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  Gemma 4 Live Server
                </span>
                <input
                  type="radio"
                  name="provider"
                  value="gemma"
                  checked={provider === "gemma"}
                  onChange={() => setProvider("gemma")}
                  className="h-4 w-4 text-blue-600"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Sends live requests to your OpenAI-compatible Gemma 4 inference server (vLLM, Ollama, etc.) configured in backend environment.
              </p>
              <span className="mt-3 inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 w-fit dark:bg-emerald-950 dark:text-emerald-300">
                Live Model Inference
              </span>
            </label>
          </div>
        </div>

        {/* Step 2: Task selection */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                2. Benchmark Tasks (Digital Literacy v1.0)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Select task groups to evaluate across English, Hindi, Punjabi, and Odia.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSelectAllTasks}
              className="text-xs font-semibold text-blue-600 hover:text-blue-500"
            >
              Select All (6)
            </button>
          </div>

          {benchmarks.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {benchmarks[0].tasks.map((task) => {
                const isSelected = selectedTasks.includes(task.task_id);
                return (
                  <div
                    key={task.task_id}
                    onClick={() => handleTaskToggle(task.task_id)}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/30 dark:border-blue-500 dark:bg-blue-950/20"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-1 h-4 w-4 rounded text-blue-600"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {task.task_id}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400 capitalize">
                          {task.difficulty}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {task.canonical_intent}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 3: Sampling parameters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-blue-600" />
            3. Sampling Parameters (Frozen across all languages)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Identical generation parameters are applied across all language variants to ensure scientific parity.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Temperature</span>
                <span className="font-mono font-bold">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="mt-2 w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Top P</span>
                <span className="font-mono font-bold">{topP}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                className="mt-2 w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Max Generation Tokens</span>
                <span className="font-mono font-bold">{maxTokens}</span>
              </div>
              <input
                type="number"
                min="128"
                max="4096"
                step="64"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/"
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLaunching || selectedTasks.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-500 disabled:opacity-50"
          >
            {isLaunching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Launching...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Start Evaluation Run ({selectedTasks.length} tasks)
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
